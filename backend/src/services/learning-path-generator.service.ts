import { aiService } from './ai.service';
import { IGenerateLearningPathInput, ILearningPathPromptData } from '../types/ai.types';
import { LearningPath } from '../models/learning-path.model';
import { Assessment } from '../models/assessment.model';
import { Subject } from '../models/subject.model';
import mongoose from 'mongoose';

/**
 * Build a map from topic subdocument _id (string) to topic name
 * for a given subject. Returns an empty map if the subject has no topics.
 */
const buildTopicNameMap = async (subjectId: string): Promise<Map<string, string>> => {
  if (!mongoose.Types.ObjectId.isValid(subjectId)) return new Map();

  const subject = await Subject.findById(subjectId).select('topics').lean();
  if (!subject?.topics) return new Map();

  return new Map<string, string>(
    subject.topics.map((t: any) => [t._id.toString(), t.name]),
  );
};

// Số milestone tối đa cho phép — tránh AI sinh hàng trăm tuần vô lý.
const MAX_MILESTONES = 16;

const generateLearningPathPrompt = (
  data: ILearningPathPromptData,
  weekCount: number,
): string => {
  return `
Bạn là chuyên gia tư vấn giáo dục. Hãy tạo lộ trình học tập cá nhân hóa dựa trên thông tin sau:

Kết quả đánh giá đầu vào:
- Điểm mạnh: ${data.assessmentResult.strengths.join(', ') || 'Chưa xác định'}
- Điểm yếu: ${data.assessmentResult.weaknesses.join(', ') || 'Chưa xác định'}
- Mức độ hiện tại: ${data.assessmentResult.currentLevel}

Mục tiêu:
- Mức độ mong muốn: ${data.targetLevel}
- Ngày hoàn thành: ${data.targetDate}
- Thời gian học/tuần: ${data.weeklyHours} giờ

Yêu cầu:
1. Tạo ĐÚNG ${weekCount} milestone (mỗi milestone tương ứng 1 tuần). KHÔNG được sinh nhiều hơn ${weekCount} milestone.
2. Mỗi milestone có tiêu đề, chủ đề cần học, độ khó
3. Đề xuất tài nguyên học tập (video, bài viết, bài tập)
4. Ưu tiên topics yếu trước
5. estimatedDays luôn = 7
6. Tổng thời gian phải phù hợp với targetDate

Format JSON (chỉ trả về JSON, không có text khác):
{
  "milestones": [
    {
      "title": "Tuần 1: Tên milestone",
      "topicIds": [],
      "difficulty": 1,
      "estimatedDays": 7,
      "resources": [
        { "type": "video", "title": "Tên video", "url": "" }
      ]
    }
  ]
}
`.trim();
};

export class LearningPathGeneratorService {
  async generate(input: IGenerateLearningPathInput, userId: string): Promise<any> {
    // Lấy tất cả các bài đánh giá (1-3) để tổng hợp điểm mạnh/yếu.
    const assessments = await Assessment.find({ _id: { $in: input.assessmentIds } });
    const topicNameMap = await buildTopicNameMap(input.subjectId);

    const labelTopic = (id: mongoose.Types.ObjectId | string): string => {
      const key = id.toString();
      return topicNameMap.get(key) ?? key;
    };

    // Cộng dồn correct/total theo topicId trên tất cả bài đánh giá.
    type Agg = { correct: number; total: number };
    const aggByTopic = new Map<string, Agg>();
    for (const a of assessments) {
      for (const s of a?.results?.skillAnalysis ?? []) {
        const key = s.topicId.toString();
        const cur = aggByTopic.get(key) ?? { correct: 0, total: 0 };
        cur.correct += s.correct;
        cur.total += s.total;
        aggByTopic.set(key, cur);
      }
    }
    const aggList = Array.from(aggByTopic.entries()).map(([topicId, v]) => ({
      topicId,
      ...v,
      rate: v.total > 0 ? v.correct / v.total : 0,
    }));

    // Trình độ hiện tại = recommendedLevel của bài mới nhất (nếu có).
    const latest = assessments
      .filter((a) => a?.results?.recommendedLevel)
      .sort((a, b) => {
        const tb = (b.get('completedAt') || b.get('createdAt') || new Date(0)).getTime();
        const ta = (a.get('completedAt') || a.get('createdAt') || new Date(0)).getTime();
        return tb - ta;
      })[0];

    const promptData: ILearningPathPromptData = {
      assessmentResult: {
        strengths: aggList
          .filter((s) => s.total > 0 && s.rate > 0.7)
          .map((s) => labelTopic(s.topicId)),
        weaknesses: aggList
          .filter((s) => s.total > 0 && s.rate < 0.5)
          .map((s) => labelTopic(s.topicId)),
        currentLevel: latest?.results?.recommendedLevel || 'basic',
      },
      targetLevel: input.targetLevel,
      targetDate: input.targetDate,
      weeklyHours: input.weeklyStudyHours,
    };

    // Tính số tuần từ hôm nay đến targetDate; clamp [1, MAX_MILESTONES] để
    // AI không sinh hàng trăm milestone khi user chọn ngày quá xa.
    const now = new Date();
    const target = new Date(input.targetDate);
    const daysUntil = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
    const weekCount = Math.max(1, Math.min(MAX_MILESTONES, Math.ceil(daysUntil / 7)));

    const prompt = generateLearningPathPrompt(promptData, weekCount);
    const response = await aiService.generate(prompt);

    // Parse JSON response
    let pathData: any;
    try {
      pathData = JSON.parse(response);
    } catch (error) {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        pathData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Calculate dates
    const startDate = new Date();
    const targetDate = new Date(input.targetDate);

    // Create milestones with dates. Cap số lượng theo weekCount để defensive
    // — nếu AI ignore yêu cầu trong prompt và trả về quá nhiều milestone.
    const rawMilestones: any[] = Array.isArray(pathData.milestones)
      ? pathData.milestones.slice(0, weekCount)
      : [];
    const milestones = rawMilestones.map((m: any, index: number) => {
      const milestoneStart = new Date(startDate);
      milestoneStart.setDate(milestoneStart.getDate() + index * m.estimatedDays);

      // AI hay trả topicIds là string không phải ObjectId hợp lệ — lọc rồi mới convert
      // để tránh ném lỗi "Cast to ObjectId failed" khiến cả request fail.
      const topicIds = Array.isArray(m.topicIds)
        ? m.topicIds
            .filter((id: unknown): id is string =>
              typeof id === 'string' && mongoose.Types.ObjectId.isValid(id),
            )
            .map((id: string) => new mongoose.Types.ObjectId(id))
        : [];

      return {
        title: m.title,
        topicIds,
        difficulty: m.difficulty,
        estimatedDays: m.estimatedDays,
        resources: m.resources || [],
        completionRate: 0,
      };
    });

    // Create learning path in database
    const learningPath = new LearningPath({
      userId: new mongoose.Types.ObjectId(userId),
      subjectId: new mongoose.Types.ObjectId(input.subjectId),
      basedOnAssessmentId: new mongoose.Types.ObjectId(input.assessmentIds[0]),
      status: 'active',
      startDate,
      targetDate,
      milestones,
      progressPercent: 0,
    });

    return learningPath.save();
  }
}

export const learningPathGenerator = new LearningPathGeneratorService();

import { aiService } from './ai.service';
import { IGenerateLearningPathInput, ILearningPathPromptData } from '../types/ai.types';
import { LearningPath } from '../models/learning-path.model';
import { Assessment } from '../models/assessment.model';
import mongoose from 'mongoose';

const generateLearningPathPrompt = (data: ILearningPathPromptData): string => {
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
1. Chia lộ trình thành các milestone theo tuần (mỗi tuần là 1 milestone)
2. Mỗi milestone có tiêu đề, chủ đề cần học, độ khó
3. Đề xuất tài nguyên học tập (video, bài viết, bài tập)
4. Ưu tiên topics yếu trước
5. Xác định số ngày dự kiến hoàn thành mỗi milestone
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
    // Get assessment result
    const assessment = await Assessment.findById(input.assessmentId);

    const promptData: ILearningPathPromptData = {
      assessmentResult: {
        strengths: assessment?.results?.skillAnalysis
          ?.filter(s => (s.correct / s.total) > 0.7)
          .map(s => s.topicId.toString()) || [],
        weaknesses: assessment?.results?.skillAnalysis
          ?.filter(s => (s.correct / s.total) < 0.5)
          .map(s => s.topicId.toString()) || [],
        currentLevel: assessment?.results?.recommendedLevel || 'basic',
      },
      targetLevel: input.targetLevel,
      targetDate: input.targetDate,
      weeklyHours: input.weeklyStudyHours,
    };

    const prompt = generateLearningPathPrompt(promptData);
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

    // Create milestones with dates
    const milestones = pathData.milestones?.map((m: any, index: number) => {
      const milestoneStart = new Date(startDate);
      milestoneStart.setDate(milestoneStart.getDate() + index * m.estimatedDays);

      return {
        title: m.title,
        topicIds: m.topicIds?.map((id: string) => new mongoose.Types.ObjectId(id)) || [],
        difficulty: m.difficulty,
        estimatedDays: m.estimatedDays,
        resources: m.resources || [],
        completionRate: 0,
      };
    }) || [];

    // Create learning path in database
    const learningPath = new LearningPath({
      userId: new mongoose.Types.ObjectId(userId),
      subjectId: new mongoose.Types.ObjectId(input.subjectId),
      basedOnAssessmentId: new mongoose.Types.ObjectId(input.assessmentId),
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

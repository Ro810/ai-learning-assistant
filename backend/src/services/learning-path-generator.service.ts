import { aiService } from './ai.service';
import { IGenerateLearningPathInput } from '../types/ai.types';
import { LearningPath } from '../models/learning-path.model';
import { Assessment } from '../models/assessment.model';
import { Subject } from '../models/subject.model';
import mongoose from 'mongoose';

// Số milestone tối đa cho phép — tránh path quá dài nếu môn có hàng trăm chủ đề.
const MAX_MILESTONES = 30;
// Trần số ngày mỗi milestone (số ngày được chia đều theo deadline, clamp tại đây).
const MAX_DAYS_PER_MILESTONE = 14;

// Mỗi chủ đề = 1 chặng. Topic kèm thông tin đúng/sai (nếu có bài đánh giá) để
// AI biết chủ đề yếu/mạnh khi đặt độ khó & nội dung.
type OrderedTopic = {
  id: string;
  name: string;
  rate: number | null; // null = chưa có dữ liệu đánh giá
  correct: number;
  total: number;
};

interface PromptContext {
  subjectName: string;
  // Danh sách topic ĐÃ sắp xếp theo ưu tiên (yếu trước) — mỗi topic là 1 chặng.
  orderedTopics: OrderedTopic[];
  currentLevel: string;
  targetLevel: 'basic' | 'intermediate' | 'advanced';
  targetDate: string;
  weeklyHours: number;
}

const generateLearningPathPrompt = (ctx: PromptContext): string => {
  // Render topic list theo format `- <id> : <name> (đúng x/y)` để AI bám đúng id.
  const topicList = ctx.orderedTopics
    .map((t) => {
      const stat = t.total > 0 ? ` (đúng ${t.correct}/${t.total} = ${Math.round((t.rate ?? 0) * 100)}%)` : ' (chưa đánh giá)';
      return `  - ${t.id} : ${t.name}${stat}`;
    })
    .join('\n');

  return `
Bạn là chuyên gia tư vấn giáo dục. Hãy tạo lộ trình học tập cá nhân hóa cho môn "${ctx.subjectName}".

Bối cảnh:
- Trình độ hiện tại: ${ctx.currentLevel}
- Trình độ mục tiêu: ${ctx.targetLevel}
- Ngày hoàn thành: ${ctx.targetDate}
- Thời gian học/tuần: ${ctx.weeklyHours} giờ

Danh sách CHỦ ĐỀ cần học (ĐÃ sắp xếp theo ưu tiên — chủ đề yếu/chưa đánh giá đặt trước):
${topicList}

Yêu cầu output:
1. Tạo ĐÚNG ${ctx.orderedTopics.length} milestone — MỖI milestone ứng với ĐÚNG 1 chủ đề
   trong list trên, GIỮ NGUYÊN THỨ TỰ list.
2. Mỗi milestone phải có:
   - topicIds: mảng chứa ĐÚNG 1 id (id của chủ đề tương ứng, lấy từ list trên)
   - title: ngắn gọn, mô tả nội dung học của chủ đề đó (vd "Nắm vững biến và cú pháp Python")
   - resources: 2-4 tài nguyên (video|article|exercise) có title cụ thể;
     url chỉ ghi khi BIẾT CHẮC tồn tại, không bịa link giả.
   (Độ khó và số ngày học do hệ thống tự tính theo cấp độ mục tiêu & deadline — KHÔNG cần trả.)

Format JSON (chỉ trả về JSON, không có text khác):
{
  "milestones": [
    {
      "topicIds": ["<id từ list>"],
      "title": "string",
      "resources": [
        { "type": "video", "title": "string", "url": "" }
      ]
    }
  ]
}
`.trim();
};

export class LearningPathGeneratorService {
  async generate(input: IGenerateLearningPathInput, userId: string): Promise<any> {
    // Lấy tất cả các bài đánh giá (1-3) để tổng hợp điểm mạnh/yếu.
    const [assessments, subject] = await Promise.all([
      Assessment.find({ _id: { $in: input.assessmentIds } }),
      Subject.findById(input.subjectId).select('name topics').lean(),
    ]);

    const allTopics = (subject?.topics ?? []).map((t: any) => ({
      id: t._id.toString(),
      name: t.name,
    }));

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

    // Build danh sách topic kèm rate, rồi sắp xếp ưu tiên: yếu → chưa đánh giá → vừa → mạnh.
    const topicsWithStat: OrderedTopic[] = allTopics.map((t) => {
      const agg = aggByTopic.get(t.id);
      const total = agg?.total ?? 0;
      const correct = agg?.correct ?? 0;
      const rate = total > 0 ? correct / total : null;
      return { id: t.id, name: t.name, rate, correct, total };
    });
    // priorityScore càng nhỏ càng học trước.
    const priorityScore = (t: OrderedTopic): number => {
      if (t.rate === null) return 0.6; // chưa đánh giá → sau nhóm yếu nhất, trước nhóm vừa
      if (t.rate < 0.5) return t.rate; // yếu (0..0.5) — yếu nhất lên đầu
      if (t.rate > 0.7) return 2 + t.rate; // mạnh → cuối
      return 0.7 + t.rate; // vừa
    };
    const orderedTopics = topicsWithStat
      .sort((a, b) => priorityScore(a) - priorityScore(b))
      .slice(0, MAX_MILESTONES); // cap để path không quá dài
    const orderedIdSet = new Set(orderedTopics.map((t) => t.id));

    // Trình độ hiện tại = recommendedLevel của bài mới nhất (nếu có).
    const latest = assessments
      .filter((a) => a?.results?.recommendedLevel)
      .sort((a, b) => {
        const tb = (b.get('completedAt') || b.get('createdAt') || new Date(0)).getTime();
        const ta = (a.get('completedAt') || a.get('createdAt') || new Date(0)).getTime();
        return tb - ta;
      })[0];
    const currentLevel = latest?.results?.recommendedLevel || 'basic';

    // Môn không có topic → không thể tạo path theo chủ đề.
    if (orderedTopics.length === 0) {
      throw new Error('Môn học chưa có chủ đề; không thể tạo lộ trình.');
    }

    // Số ngày mỗi chặng = chia đều quỹ ngày đến deadline cho số chặng (clamp [1, MAX]).
    // Nhờ vậy tổng thời lượng bám theo ngày mục tiêu user chọn, không để AI tự đoán
    // ra 7-9 ngày/chặng vượt deadline.
    const now = new Date();
    const target = new Date(input.targetDate);
    const daysUntil = Math.max(1, Math.ceil((target.getTime() - now.getTime()) / 86_400_000));
    const perMilestoneDays = Math.max(
      1,
      Math.min(MAX_DAYS_PER_MILESTONE, Math.round(daysUntil / orderedTopics.length)),
    );

    // Trần độ khó theo cấp độ mục tiêu user chọn: Cơ bản → chỉ Dễ (1),
    // Trung cấp → tối đa Trung bình (2), Nâng cao → tối đa Khó (3).
    const difficultyCap =
      input.targetLevel === 'basic' ? 1 : input.targetLevel === 'intermediate' ? 2 : 3;

    const prompt = generateLearningPathPrompt({
      subjectName: subject?.name ?? 'Môn học',
      orderedTopics,
      currentLevel,
      targetLevel: input.targetLevel,
      targetDate: input.targetDate,
      weeklyHours: input.weeklyStudyHours,
    });
    const response = await aiService.generate(prompt);

    // Parse JSON response (AI hay kèm thêm text — extract block JSON đầu tiên).
    let pathData: any;
    try {
      pathData = JSON.parse(response);
    } catch (error) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        pathData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Index milestone của AI theo topicId (chỉ nhận id hợp lệ thuộc orderedTopics).
    const aiByTopic = new Map<string, any>();
    if (Array.isArray(pathData.milestones)) {
      for (const m of pathData.milestones) {
        const tid = Array.isArray(m?.topicIds) ? m.topicIds[0] : undefined;
        if (typeof tid === 'string' && orderedIdSet.has(tid) && !aiByTopic.has(tid)) {
          aiByTopic.set(tid, m);
        }
      }
    }

    // Build CỨNG 1 milestone cho MỖI topic theo đúng thứ tự ưu tiên — không phụ
    // thuộc AI có trả đủ/đúng hay không. Thiếu thì synthesize default từ topic.
    const startDate = new Date();
    const targetDate = new Date(input.targetDate);

    const milestones = orderedTopics.map((topic) => {
      const m = aiByTopic.get(topic.id) ?? {};

      // Số ngày bám theo deadline (không dùng số AI tự đoán).
      const estimatedDays = perMilestoneDays;

      // Difficulty cơ sở theo độ yếu: yếu → 1, chưa đánh giá/vừa → 2, mạnh → 3;
      // sau đó CHẶN TRẦN theo cấp độ mục tiêu (vd Cơ bản → luôn = 1 Dễ).
      const baseDiff = topic.rate === null ? 2 : topic.rate < 0.5 ? 1 : topic.rate > 0.7 ? 3 : 2;
      const difficulty = Math.min(difficultyCap, baseDiff);

      const resources = Array.isArray(m.resources)
        ? m.resources
            .filter(
              (r: any) =>
                r &&
                ['video', 'article', 'exercise'].includes(r.type) &&
                typeof r.title === 'string' &&
                r.title.trim().length > 0,
            )
            .map((r: any) => ({
              type: r.type,
              title: r.title,
              url: typeof r.url === 'string' && r.url.startsWith('http') ? r.url : null,
            }))
        : [];

      return {
        title:
          typeof m.title === 'string' && m.title.trim()
            ? m.title
            : `Học chủ đề: ${topic.name}`,
        topicIds: [new mongoose.Types.ObjectId(topic.id)],
        difficulty,
        estimatedDays,
        resources,
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

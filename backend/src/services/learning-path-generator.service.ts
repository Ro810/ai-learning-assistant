import { aiService } from './ai.service';
import { IGenerateLearningPathInput } from '../types/ai.types';
import { LearningPath } from '../models/learning-path.model';
import { Assessment } from '../models/assessment.model';
import { Subject } from '../models/subject.model';
import mongoose from 'mongoose';

// Số milestone tối đa cho phép — tránh AI sinh hàng trăm tuần vô lý.
const MAX_MILESTONES = 16;
// Bounds cho estimatedDays mỗi milestone — đủ rộng để AI điều chỉnh theo workload
// nhưng không cho phép 1 ngày (quá ít) hay 30 ngày (1 milestone nuốt cả tháng).
const MIN_DAYS_PER_MILESTONE = 3;
const MAX_DAYS_PER_MILESTONE = 14;

type TopicMeta = { id: string; name: string };
type WeakTopic = TopicMeta & { rate: number; correct: number; total: number };

interface PromptContext {
  subjectName: string;
  // Danh sách FULL topics của subject — AI chỉ được phép chọn id trong list này.
  allTopics: TopicMeta[];
  // Topics yếu (rate < 0.5) — AI nên ưu tiên vào các milestone đầu.
  weakTopics: WeakTopic[];
  // Topics mạnh (rate > 0.7) — có thể skip hoặc làm nhẹ ở cuối.
  strongTopicNames: string[];
  currentLevel: string;
  targetLevel: 'basic' | 'intermediate' | 'advanced';
  targetDate: string;
  weeklyHours: number;
  weekCount: number;
}

const generateLearningPathPrompt = (ctx: PromptContext): string => {
  // Render topic list theo format `- <id> : <name>` để AI bám đúng id.
  const topicList = ctx.allTopics
    .map((t) => `  - ${t.id} : ${t.name}`)
    .join('\n');
  const weakList = ctx.weakTopics.length
    ? ctx.weakTopics
        .map((t) => `  - ${t.id} : ${t.name} (đúng ${t.correct}/${t.total} = ${Math.round(t.rate * 100)}%)`)
        .join('\n')
    : '  (Không có topic yếu rõ rệt)';
  const strongList = ctx.strongTopicNames.length
    ? ctx.strongTopicNames.join(', ')
    : 'Chưa có';

  return `
Bạn là chuyên gia tư vấn giáo dục. Hãy tạo lộ trình học tập cá nhân hóa cho môn "${ctx.subjectName}".

Bối cảnh:
- Trình độ hiện tại: ${ctx.currentLevel}
- Trình độ mục tiêu: ${ctx.targetLevel}
- Ngày hoàn thành: ${ctx.targetDate}
- Thời gian học/tuần: ${ctx.weeklyHours} giờ
- Điểm mạnh: ${strongList}

Danh sách CHỦ ĐỀ của môn học (chỉ được chọn id từ list này, KHÔNG bịa id mới):
${topicList}

Các CHỦ ĐỀ YẾU cần ưu tiên (đặt vào milestone sớm, lặp lại nếu cần):
${weakList}

Yêu cầu output:
1. Tạo ĐÚNG ${ctx.weekCount} milestone (mỗi milestone ~1 đợt học, KHÔNG nhất thiết 1 tuần cố định).
2. Mỗi milestone phải có:
   - title: ngắn gọn, mô tả nội dung học (vd "Ôn tập hàm số bậc 2 và đồ thị")
   - topicIds: 1-3 id LẤY TỪ list trên (KHÔNG được trả mảng rỗng nếu list có topic)
   - difficulty: 1 (dễ) | 2 (vừa) | 3 (khó)
   - estimatedDays: số ngày học thực tế, từ ${MIN_DAYS_PER_MILESTONE} đến ${MAX_DAYS_PER_MILESTONE},
     phù hợp với khối lượng topic và ${ctx.weeklyHours} giờ/tuần
   - resources: 2-4 tài nguyên (video|article|exercise) có title cụ thể;
     url chỉ ghi khi BIẾT CHẮC tồn tại, không bịa link giả.
3. Sắp xếp theo độ ưu tiên: topic yếu trước → topic chưa biết → topic mạnh (ôn nhẹ).
4. Tổng estimatedDays cộng lại nên xấp xỉ số ngày từ hôm nay đến ${ctx.targetDate}.

Format JSON (chỉ trả về JSON, không có text khác):
{
  "milestones": [
    {
      "title": "string",
      "topicIds": ["<id từ list>"],
      "difficulty": 1,
      "estimatedDays": 7,
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

    // Build map topicId -> name, và snapshot full topic list để inject vào prompt.
    const allTopics: TopicMeta[] = (subject?.topics ?? []).map((t: any) => ({
      id: t._id.toString(),
      name: t.name,
    }));
    const topicNameMap = new Map<string, string>(allTopics.map((t) => [t.id, t.name]));
    const allTopicIdSet = new Set(allTopics.map((t) => t.id));

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

    // Weak topics (rate < 0.5) — đính kèm id + name để prompt có context đầy đủ.
    const weakTopics: WeakTopic[] = aggList
      .filter((s) => s.total > 0 && s.rate < 0.5)
      .map((s) => ({
        id: s.topicId,
        name: topicNameMap.get(s.topicId) ?? s.topicId,
        rate: s.rate,
        correct: s.correct,
        total: s.total,
      }))
      .sort((a, b) => a.rate - b.rate); // yếu nhất lên đầu

    const strongTopicNames: string[] = aggList
      .filter((s) => s.total > 0 && s.rate > 0.7)
      .map((s) => topicNameMap.get(s.topicId) ?? s.topicId);

    // Trình độ hiện tại = recommendedLevel của bài mới nhất (nếu có).
    const latest = assessments
      .filter((a) => a?.results?.recommendedLevel)
      .sort((a, b) => {
        const tb = (b.get('completedAt') || b.get('createdAt') || new Date(0)).getTime();
        const ta = (a.get('completedAt') || a.get('createdAt') || new Date(0)).getTime();
        return tb - ta;
      })[0];
    const currentLevel = latest?.results?.recommendedLevel || 'basic';

    // Tính số tuần từ hôm nay đến targetDate; clamp [1, MAX_MILESTONES] để
    // AI không sinh hàng trăm milestone khi user chọn ngày quá xa.
    const now = new Date();
    const target = new Date(input.targetDate);
    const daysUntil = Math.max(
      1,
      Math.ceil((target.getTime() - now.getTime()) / 86_400_000),
    );
    const weekCount = Math.max(1, Math.min(MAX_MILESTONES, Math.ceil(daysUntil / 7)));

    const prompt = generateLearningPathPrompt({
      subjectName: subject?.name ?? 'Môn học',
      allTopics,
      weakTopics,
      strongTopicNames,
      currentLevel,
      targetLevel: input.targetLevel,
      targetDate: input.targetDate,
      weeklyHours: input.weeklyStudyHours,
      weekCount,
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

    // Cap số lượng theo weekCount để defensive — nếu AI ignore yêu cầu trong prompt.
    const rawMilestones: any[] = Array.isArray(pathData.milestones)
      ? pathData.milestones.slice(0, weekCount)
      : [];

    // Build milestones với startDate cộng dồn theo estimatedDays thật của từng milestone.
    const startDate = new Date();
    const targetDate = new Date(input.targetDate);
    let cursorDay = 0;

    const milestones = rawMilestones.map((m: any, index: number) => {
      // Clamp estimatedDays vào bounds, default 7 nếu AI trả số rác.
      const rawDays = Number(m.estimatedDays);
      const estimatedDays = Number.isFinite(rawDays)
        ? Math.max(
            MIN_DAYS_PER_MILESTONE,
            Math.min(MAX_DAYS_PER_MILESTONE, Math.round(rawDays)),
          )
        : 7;

      // Lọc topicIds: phải hợp lệ ObjectId VÀ thuộc danh sách topics của subject.
      // Tránh AI bịa id ngoài list khiến milestone có topic "ma".
      const topicIds = Array.isArray(m.topicIds)
        ? m.topicIds
            .filter(
              (id: unknown): id is string =>
                typeof id === 'string' &&
                mongoose.Types.ObjectId.isValid(id) &&
                allTopicIdSet.has(id),
            )
            .map((id: string) => new mongoose.Types.ObjectId(id))
        : [];

      // Resources: lọc các entry có type + title hợp lệ, url cho phép null/empty.
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

      cursorDay += estimatedDays;
      void index; // startDate hiện cộng dồn — không dùng index nữa, giữ để rõ ý.

      // Difficulty: clamp 1..3.
      const rawDiff = Number(m.difficulty);
      const difficulty = Number.isFinite(rawDiff)
        ? Math.max(1, Math.min(3, Math.round(rawDiff)))
        : 2;

      return {
        title: typeof m.title === 'string' && m.title.trim() ? m.title : `Milestone ${index + 1}`,
        topicIds,
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

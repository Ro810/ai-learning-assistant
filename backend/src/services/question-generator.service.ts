import { aiService } from './ai.service';
import { IGenerateQuestionsInput, IQuestionPromptData } from '../types/ai.types';
import { Question } from '../models/question.model';
import { Subject } from '../models/subject.model';
import mongoose from 'mongoose';

/**
 * Resolve topic subdocument names from Subject collection.
 * Falls back to ID string if a topic cannot be found.
 */
const resolveTopicNames = async (
  subjectId: string | undefined,
  topicIds: string[],
): Promise<string[]> => {
  if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
    return topicIds;
  }

  const subject = await Subject.findById(subjectId).select('topics').lean();
  if (!subject?.topics) return topicIds;

  const idToName = new Map<string, string>(
    subject.topics.map((t: any) => [t._id.toString(), t.name]),
  );

  return topicIds.map((id) => idToName.get(id) ?? id);
};

const generateQuestionPrompt = (data: IQuestionPromptData): string => {
  if (data.language === 'en') {
    const diff =
      data.difficulty === 1 ? 'Basic' : data.difficulty === 2 ? 'Intermediate' : 'Advanced';
    return `
You are an English teacher. Generate ${data.count} multiple-choice questions on the topic: ${data.topic}.

Difficulty: ${diff}

Requirements:
1. Each question has 4 options (A, B, C, D).
2. Exactly one correct answer.
3. Write the question, all options, and the explanation entirely in English.
4. Provide a clear, concise explanation for the correct answer.

Return ONLY a JSON array (no surrounding text, no markdown):
[
  {
    "questionText": "...",
    "options": [
      { "id": "A", "text": "...", "isCorrect": false },
      { "id": "B", "text": "...", "isCorrect": true },
      { "id": "C", "text": "...", "isCorrect": false },
      { "id": "D", "text": "...", "isCorrect": false }
    ],
    "correctAnswer": "B",
    "explanation": "..."
  }
]
`.trim();
  }

  const difficultyLabel =
    data.difficulty === 1 ? 'Dễ (Basic)' : data.difficulty === 2 ? 'Trung bình (Intermediate)' : 'Khó (Advanced)';

  return `
Bạn là một giáo viên chuyên môn. Hãy sinh ${data.count} câu hỏi trắc nghiệm về chủ đề: ${data.topic}.

Độ khó: ${difficultyLabel}

Yêu cầu:
1. Mỗi câu hỏi có 4 đáp án (A, B, C, D)
2. Chỉ có 1 đáp án đúng
3. Cung cấp giải thích chi tiết cho mỗi câu
4. Câu hỏi phải chính xác về mặt kiến thức

Format JSON (chỉ trả về JSON, không có text khác):
[
  {
    "questionText": "Câu hỏi...",
    "options": [
      { "id": "A", "text": "Đáp án A", "isCorrect": false },
      { "id": "B", "text": "Đáp án B", "isCorrect": true },
      { "id": "C", "text": "Đáp án C", "isCorrect": false },
      { "id": "D", "text": "Đáp án D", "isCorrect": false }
    ],
    "correctAnswer": "B",
    "explanation": "Giải thích chi tiết..."
  }
]
`.trim();
};

export class QuestionGeneratorService {
  async generate(input: IGenerateQuestionsInput): Promise<any[]> {
    const topicIds = input.topicIds.map(id => new mongoose.Types.ObjectId(id));

    // Resolve real topic names from Subject collection so the AI prompt
    // contains meaningful subject matter instead of opaque ObjectIds.
    const topicNames = await resolveTopicNames(input.subjectId, input.topicIds);
    const topicLabel = topicNames.join(', ');

    const prompt = generateQuestionPrompt({
      topic: topicLabel,
      difficulty: input.difficulty,
      count: input.count,
      questionType: input.questionType,
      language: input.language ?? 'vi',
    });

    let response: string;
    try {
      response = await aiService.generate(prompt);
    } catch (err: any) {
      // Surface SDK-level error (auth, quota, network) with clear context
      console.error('[QuestionGenerator] Gemini SDK error:', err?.message);
      throw new Error(`Gemini SDK error: ${err?.message ?? 'unknown'}`);
    }

    if (!response || response.trim().length === 0) {
      console.error('[QuestionGenerator] Empty response from Gemini');
      throw new Error('Gemini returned empty response');
    }

    // Strip markdown code fences (```json ... ``` or ``` ... ```) which Gemini
    // often wraps JSON in despite the "no text" instruction.
    const cleanResponse = response
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let questionsData: any[];
    try {
      questionsData = JSON.parse(cleanResponse);
    } catch {
      // Fallback: extract the first JSON array anywhere in the text
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          questionsData = JSON.parse(jsonMatch[0]);
        } catch (parseErr: any) {
          console.error('[QuestionGenerator] JSON parse failed. Raw response (first 500 chars):',
            response.slice(0, 500));
          throw new Error(`Failed to parse AI response as JSON: ${parseErr?.message}`);
        }
      } else {
        console.error('[QuestionGenerator] No JSON array found in response (first 500 chars):',
          response.slice(0, 500));
        throw new Error('AI response contains no JSON array');
      }
    }

    if (!Array.isArray(questionsData) || questionsData.length === 0) {
      console.error('[QuestionGenerator] Parsed data is not a non-empty array:',
        JSON.stringify(questionsData).slice(0, 300));
      throw new Error('AI response parsed but is not a non-empty array');
    }

    // Save questions to database
    const savedQuestions = await Promise.all(
      questionsData.map(async (q) => {
        const question = new Question({
          topicIds,
          difficulty: input.difficulty,
          type: input.questionType,
          content: {
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          },
          metadata: {
            generatedBy: 'gemini',
            generationPrompt: prompt,
            verified: false,
          },
          usageCount: 0,
        });
        return question.save();
      })
    );

    return savedQuestions;
  }
}

export const questionGenerator = new QuestionGeneratorService();

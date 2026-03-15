import { aiService } from './ai.service';
import { IGenerateQuestionsInput, IQuestionPromptData } from '../types/ai.types';
import { Question } from '../models/question.model';
import mongoose from 'mongoose';

const generateQuestionPrompt = (data: IQuestionPromptData): string => {
  const difficultyLabel = data.difficulty === 1 ? 'Dễ (Basic)' : data.difficulty === 2 ? 'Trung bình (Intermediate)' : 'Khó (Advanced)';
  const questionTypeLabel = data.questionType === 'multiple_choice' ? 'Trắc nghiệm' : data.questionType === 'fill_blank' ? 'Điền khuyết' : 'Tự luận';

  return `
Bạn là một giáo viên chuyên môn. Hãy sinh ${data.count} câu hỏi ${questionTypeLabel} về chủ đề: ${data.topic}.

Độ khó: ${difficultyLabel}

Yêu cầu:
1. Mỗi câu hỏi có 4 đáp án (A, B, C, D) nếu là trắc nghiệm
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
    // Get topic info from database
    const topicIds = input.topicIds.map(id => new mongoose.Types.ObjectId(id));

    // For now, use a default topic string - in production, fetch from Subject model
    const topicName = `Topic ${input.topicIds.join(', ')}`;

    const prompt = generateQuestionPrompt({
      topic: topicName,
      difficulty: input.difficulty,
      count: input.count,
      questionType: input.questionType,
    });

    const response = await aiService.generate(prompt);

    // Parse JSON response
    let questionsData: any[];
    try {
      questionsData = JSON.parse(response);
    } catch (error) {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
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
            generatedBy: 'claude',
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

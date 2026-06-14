import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiService } from '../services/ai.service';
import { formatAIError } from '../services/ai-error-formatter';

const optionSchema = z.object({ id: z.string(), text: z.string() });

const explainSchema = z.object({
  question: z.object({
    questionText: z.string().min(1),
    options: z.array(optionSchema).optional(),
    correctAnswer: z.string().optional(),
    explanation: z.string().optional(),
  }),
  // Lịch sử hội thoại (gồm tin nhắn mới nhất của học sinh ở cuối).
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

// Dựng prompt gia sư: nhúng câu hỏi + đáp án + hội thoại, yêu cầu trả lời tin mới nhất.
const buildExplainPrompt = (data: z.infer<typeof explainSchema>): string => {
  const { question, messages } = data;
  const optionsText = (question.options ?? [])
    .map((o) => `  ${o.id.toUpperCase()}. ${o.text}`)
    .join('\n');
  const convo = messages
    .map((m) => `${m.role === 'user' ? 'Học sinh' : 'Gia sư'}: ${m.content}`)
    .join('\n');

  return `
Bạn là một gia sư thân thiện, kiên nhẫn. Học sinh đang hỏi thêm về một câu hỏi trắc nghiệm.

CÂU HỎI:
${question.questionText}
${optionsText ? `\nCÁC LỰA CHỌN:\n${optionsText}` : ''}
${question.correctAnswer ? `\nĐÁP ÁN ĐÚNG: ${question.correctAnswer}` : ''}
${question.explanation ? `\nGIẢI THÍCH GỐC: ${question.explanation}` : ''}

HỘI THOẠI:
${convo}

Hãy trả lời tin nhắn MỚI NHẤT của học sinh: giải thích rõ ràng, dễ hiểu, NGẮN GỌN, bằng tiếng Việt.
Nếu có đoạn mã thì để trong khối \`\`\`. Bám sát kiến thức của câu hỏi, KHÔNG bịa. Chỉ trả về nội dung trả lời (không lặp lại "Gia sư:").
`.trim();
};

export const explainQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = explainSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    let reply: string;
    try {
      reply = await aiService.generate(buildExplainPrompt(parsed.data));
    } catch (err: any) {
      const formatted = formatAIError(err);
      console.error('[AICtrl] explainQuestion failed:', formatted.detail);
      return res.status(formatted.status).json({
        success: false,
        message: formatted.message,
        ...(formatted.retryAfterSec ? { retryAfterSec: formatted.retryAfterSec } : {}),
      });
    }

    res.json({ success: true, data: { reply: reply.trim() } });
  } catch (error) {
    next(error);
  }
};

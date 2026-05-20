import { GoogleGenAI } from '@google/genai';
import { IAIProvider } from '../types/ai.types';
import { geminiKeyPool } from './gemini-key-pool';
import { formatAIError } from './ai-error-formatter';

// Google Gemini provider — free tier, hỗ trợ nhiều API key xoay vòng.
// Khi 1 key chạm quota (429), tự chuyển sang key kế tiếp trong cùng request
// (xem gemini-key-pool.ts). Cùng interface IAIProvider nên call site không đổi.
export class GeminiService implements IAIProvider {
  private model: string;

  constructor() {
    if (!geminiKeyPool.hasKeys()) {
      throw new Error('GEMINI_API_KEY(S) is not configured');
    }
    // Default 2.5-flash: 2.0-flash free-tier RPD quota dễ cạn, 1.5-* đã deprecated 2025.
    this.model = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
  }

  async generateContent(prompt: string): Promise<string> {
    const keys = geminiKeyPool.candidates();
    let lastErr: unknown;

    for (const apiKey of keys) {
      try {
        const client = new GoogleGenAI({ apiKey });
        const response = await client.models.generateContent({
          model: this.model,
          contents: prompt,
        });
        geminiKeyPool.markGood(apiKey);
        return response.text ?? '';
      } catch (err) {
        lastErr = err;
        // Chỉ xoay key khi lỗi do hết quota (429). Lỗi khác (503 overload, 400
        // prompt sai, ...) không phải lỗi của key → ném luôn, đổi key vô ích.
        if (formatAIError(err).status === 429) {
          geminiKeyPool.markExhausted(apiKey);
          console.warn(
            `[Gemini] Key ...${apiKey.slice(-6)} hết quota (429), thử key kế tiếp.`,
          );
          continue;
        }
        throw err;
      }
    }

    // Hết key khả dụng (tất cả 429) → ném lỗi cuối để controller formatAIError xử lý.
    throw lastErr;
  }
}

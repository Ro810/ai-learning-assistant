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

  // Số lần thử lại khi gặp 503 (model quá tải) trên cùng 1 key, kèm backoff.
  private static readonly MAX_RETRIES_503 = 2;

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async generateContent(prompt: string): Promise<string> {
    const keys = geminiKeyPool.candidates();
    let lastErr: unknown;

    for (const apiKey of keys) {
      const client = new GoogleGenAI({ apiKey });
      // Với mỗi key, thử lại vài lần nếu gặp 503 (quá tải tạm thời).
      for (let attempt = 0; attempt <= GeminiService.MAX_RETRIES_503; attempt++) {
        try {
          const response = await client.models.generateContent({
            model: this.model,
            contents: prompt,
          });
          geminiKeyPool.markGood(apiKey);
          return response.text ?? '';
        } catch (err) {
          lastErr = err;
          const status = formatAIError(err).status;

          // 429 — key hết quota: đánh dấu cooldown, sang key kế tiếp (bỏ retry key này).
          if (status === 429) {
            geminiKeyPool.markExhausted(apiKey);
            console.warn(`[Gemini] Key ...${apiKey.slice(-6)} hết quota (429), thử key kế tiếp.`);
            break;
          }

          // 503 — model quá tải (tạm thời): đợi backoff rồi thử lại cùng key.
          if (status === 503 && attempt < GeminiService.MAX_RETRIES_503) {
            const backoffMs = 800 * (attempt + 1);
            console.warn(`[Gemini] 503 quá tải, thử lại sau ${backoffMs}ms (lần ${attempt + 1}).`);
            await this.sleep(backoffMs);
            continue;
          }

          // 503 đã hết lượt retry → sang key khác (biết đâu key khác đỡ tải hơn).
          if (status === 503) {
            console.warn(`[Gemini] 503 quá tải, hết retry với key ...${apiKey.slice(-6)}, thử key kế tiếp.`);
            break;
          }

          // Lỗi khác (400 prompt sai, 401/403 key sai, ...) → ném luôn, đổi key vô ích.
          throw err;
        }
      }
    }

    // Hết key khả dụng (tất cả 429/503) → ném lỗi cuối để controller formatAIError xử lý.
    throw lastErr;
  }
}

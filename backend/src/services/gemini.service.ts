import { GoogleGenAI } from '@google/genai';
import { IAIProvider } from '../types/ai.types';

// Google Gemini / Gemma provider — free tier.
// Uses @google/genai SDK; same interface as ClaudeService so callers
// don't need to know which model is generating content.
export class GeminiService implements IAIProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.client = new GoogleGenAI({ apiKey });
    // Default to 2.5-flash: 2.0-flash free-tier RPD quota is easily exhausted,
    // and 1.5-* family was deprecated by Google in 2025.
    this.model = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
    });
    return response.text ?? '';
  }
}

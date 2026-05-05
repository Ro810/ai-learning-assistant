import { GeminiService } from './gemini.service';
import { IAIProvider } from '../types/ai.types';

// Single AI provider: Google Gemini / Gemma (free tier).
// Wrapped in a factory so callers go through aiService.generate() and
// the provider can be replaced later without touching call sites.
export class AIService {
  getProvider(): IAIProvider {
    return new GeminiService();
  }

  async generate(prompt: string): Promise<string> {
    return this.getProvider().generateContent(prompt);
  }
}

export const aiService = new AIService();

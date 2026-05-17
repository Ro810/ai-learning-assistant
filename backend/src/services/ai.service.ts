import { GeminiService } from './gemini.service';
import { MockAIService } from './mock-ai.service';
import { IAIProvider } from '../types/ai.types';

// Single AI provider: Google Gemini (real) or MockAIService (dev / no quota).
// Wrapped in a factory so callers go through aiService.generate() and
// the provider can be replaced later without touching call sites.
//
// Set USE_MOCK_AI=1 in .env to bypass real Gemini calls — useful when
// the free-tier quota is exhausted or while iterating on UI flows.
export class AIService {
  getProvider(): IAIProvider {
    if (process.env.USE_MOCK_AI === '1') {
      return new MockAIService();
    }
    return new GeminiService();
  }

  async generate(prompt: string): Promise<string> {
    return this.getProvider().generateContent(prompt);
  }
}

export const aiService = new AIService();

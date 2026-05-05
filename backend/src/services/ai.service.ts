import { ClaudeService } from './claude.service';
import { GeminiService } from './gemini.service';
import { IAIProvider, AIProviderType } from '../types/ai.types';

// Default to env-driven provider so switching engine is just AI_PROVIDER=...
const resolveProviderFromEnv = (): AIProviderType => {
  const value = (process.env.AI_PROVIDER || 'claude').toLowerCase();
  if (value === 'gemini' || value === 'claude' || value === 'openai') {
    return value;
  }
  return 'claude';
};

export class AIService {
  private provider: AIProviderType;

  constructor(provider?: AIProviderType) {
    this.provider = provider ?? resolveProviderFromEnv();
  }

  getProvider(): IAIProvider {
    switch (this.provider) {
      case 'gemini':
        return new GeminiService();
      case 'claude':
        return new ClaudeService();
      default:
        return new ClaudeService();
    }
  }

  async generate(prompt: string): Promise<string> {
    const provider = this.getProvider();
    return provider.generateContent(prompt);
  }
}

// Singleton instance
export const aiService = new AIService();

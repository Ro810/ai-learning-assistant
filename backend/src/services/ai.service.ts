import { ClaudeService } from './claude.service';
import { IAIProvider, AIProviderType } from '../types/ai.types';

export class AIService {
  private provider: AIProviderType;

  constructor(provider: AIProviderType = 'claude') {
    this.provider = provider;
  }

  getProvider(): IAIProvider {
    switch (this.provider) {
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

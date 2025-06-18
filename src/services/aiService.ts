// AI Service for PDF Chat Integration
// Supports OpenAI GPT-4, Anthropic Claude, Google Gemini

interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'google';
  apiKey: string;
}

interface ChatRequest {
  pdfContent: string;
  userQuestion: string;
  conversationHistory?: Array<{role: string, content: string}>;
}

export class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async chatWithPDF(request: ChatRequest): Promise<string> {
    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.chatWithOpenAI(request);
        case 'anthropic':
          return await this.chatWithClaude(request);
        case 'google':
          return await this.chatWithGemini(request);
        default:
          throw new Error('Unsupported AI provider');
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to get AI response. Please check your API key and try again.');
    }
  }

  private async chatWithOpenAI(request: ChatRequest): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that answers questions about PDF documents. Use the provided PDF content to answer questions accurately.'
          },
          {
            role: 'user',
            content: `PDF Content:\n${request.pdfContent}\n\nQuestion: ${request.userQuestion}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response generated';
  }

  private async chatWithClaude(request: ChatRequest): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `I have a PDF document with the following content:\n\n${request.pdfContent}\n\nPlease answer this question about the document: ${request.userQuestion}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || 'No response generated';
  }

  private async chatWithGemini(request: ChatRequest): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `PDF Document Content:\n${request.pdfContent}\n\nUser Question: ${request.userQuestion}\n\nPlease provide a helpful answer based on the PDF content.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Google AI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
  }
}

// Helper function to create AI service instance
export const createAIService = (provider: 'openai' | 'anthropic' | 'google', apiKey: string): AIService => {
  return new AIService({ provider, apiKey });
};

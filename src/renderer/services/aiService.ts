// AI Service for MyCoder
// This service handles communication with AI APIs like OpenAI

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIService {
  private apiKey: string | null = null;
  private baseUrl: string = 'https://api.openai.com/v1';
  private model: string = 'gpt-4';
  private temperature: number = 0.7;
  private maxTokens: number = 2048;
  private isConfigured: boolean = false;

  constructor() {
    // Try to load config from localStorage
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const savedConfig = localStorage.getItem('aiConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        this.apiKey = config.apiKey || null;
        this.model = config.model || 'gpt-4';
        this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
        this.temperature = config.temperature || 0.7;
        this.maxTokens = config.maxTokens || 2048;
        this.isConfigured = !!this.apiKey;
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
    }
  }

  private saveConfig() {
    try {
      const config = {
        apiKey: this.apiKey,
        model: this.model,
        baseUrl: this.baseUrl,
        temperature: this.temperature,
        maxTokens: this.maxTokens
      };
      localStorage.setItem('aiConfig', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save AI config:', error);
    }
  }

  setConfig(config: AIConfig) {
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.model) this.model = config.model;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    if (config.maxTokens !== undefined) this.maxTokens = config.maxTokens;
    
    this.isConfigured = !!this.apiKey;
    this.saveConfig();
  }

  getConfig(): AIConfig {
    return {
      apiKey: this.apiKey || undefined,
      model: this.model,
      baseUrl: this.baseUrl,
      temperature: this.temperature,
      maxTokens: this.maxTokens
    };
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  async sendMessage(messages: Message[]): Promise<Message> {
    // If API key is configured, we would make a real API call
    // For now, we'll simulate a response for demo purposes
    
    if (this.isConfigured && this.apiKey) {
      try {
        // This would be a real API call in production
        // return await this.callOpenAI(messages);
        
        // For demo, we'll still use the mock response
        return await this.getMockResponse(messages);
      } catch (error) {
        console.error('Error calling AI API:', error);
        return {
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again later.'
        };
      }
    } else {
      // Use mock responses for demo
      return await this.getMockResponse(messages);
    }
  }

  private async getMockResponse(messages: Message[]): Promise<Message> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lastUserMessage = messages.find(m => m.role === 'user');
        const userMessage = lastUserMessage?.content.toLowerCase() || '';
        let response: Message;
        
        // Check for code blocks in the message
        const hasCodeBlock = userMessage.includes('```');
        
        if (userMessage.includes('explain') && hasCodeBlock) {
          response = {
            role: 'assistant',
            content: `Here's an explanation of the code you shared:

The code appears to be a JavaScript/TypeScript function that processes data. Let me break it down:

1. It defines a function that takes an input parameter
2. It processes that input through several transformations
3. It returns a modified version of the data

The key parts to understand:
- The function uses modern ES6+ syntax
- It employs functional programming concepts
- It handles error cases appropriately

Would you like me to explain any specific part in more detail?`
          };
        } else if (userMessage.includes('refactor') && hasCodeBlock) {
          response = {
            role: 'assistant',
            content: `I can suggest some refactoring improvements:

\`\`\`typescript
// Refactored version with better performance
function processData(input: string[]): Result[] {
  // Early return for empty input
  if (!input || input.length === 0) return [];
  
  // Use map instead of forEach with push
  return input
    .filter(item => item && item.trim().length > 0)
    .map(item => ({
      id: generateId(item),
      value: normalizeValue(item),
      timestamp: Date.now()
    }));
}

// Helper functions
function generateId(item: string): string {
  return item.toLowerCase().replace(/\\s+/g, '-');
}

function normalizeValue(item: string): string {
  return item.trim().charAt(0).toUpperCase() + item.slice(1).toLowerCase();
}
\`\`\`

Key improvements:
1. Added type annotations
2. Used functional chain methods
3. Extracted helper functions
4. Added early return for edge cases
5. Improved variable naming`
          };
        } else if (userMessage.includes('bug') || userMessage.includes('error')) {
          response = {
            role: 'assistant',
            content: `I spotted a few potential bugs in your code:

1. **Potential null reference**: You're not checking if \`data\` is null before accessing properties
2. **Race condition**: The async operation might complete after the component unmounts
3. **Memory leak**: Event listeners aren't being properly cleaned up

Here's how you might fix the first issue:

\`\`\`javascript
// Before
const result = data.items.find(item => item.id === targetId);

// After
const result = data?.items?.find(item => item.id === targetId) || null;
\`\`\`

Would you like me to help with fixing the other issues as well?`
          };
        } else if (userMessage.includes('test') || userMessage.includes('unit test')) {
          response = {
            role: 'assistant',
            content: `Here's a unit test for your function:

\`\`\`typescript
import { describe, it, expect } from 'vitest';
import { processData } from './yourModule';

describe('processData', () => {
  it('should process valid input correctly', () => {
    // Arrange
    const input = ['item1', 'item2', 'item3'];
    
    // Act
    const result = processData(input);
    
    // Assert
    expect(result).toHaveLength(3);
    expect(result[0].value).toBeDefined();
    expect(result[0].id).toBeDefined();
  });
  
  it('should handle empty input', () => {
    expect(processData([])).toEqual([]);
    expect(processData(null)).toEqual([]);
  });
  
  it('should filter out empty items', () => {
    const input = ['item1', '', '  ', 'item2'];
    const result = processData(input);
    expect(result).toHaveLength(2);
  });
});
\`\`\`

This test covers:
- Normal operation with valid input
- Edge cases (empty array, null)
- Filtering behavior

You might want to add more specific assertions based on your exact requirements.`
          };
        } else if (userMessage.includes('document') || userMessage.includes('documentation')) {
          response = {
            role: 'assistant',
            content: `Here's documentation for your code:

\`\`\`typescript
/**
 * Processes an array of string items and converts them to result objects
 * 
 * @param {string[]} items - Array of string items to process
 * @returns {Result[]} Array of processed result objects
 * 
 * @example
 * // Returns [{id: 'hello-world', value: 'Hello world', timestamp: 1620000000000}]
 * processData(['hello world']);
 * 
 * @throws {Error} If the processing fails for any reason
 */
function processData(items: string[]): Result[] {
  // Implementation details...
}

/**
 * Represents a processed result
 */
interface Result {
  /** Unique identifier generated from the input */
  id: string;
  
  /** Normalized value derived from the input */
  value: string;
  
  /** Timestamp when the result was created */
  timestamp: number;
}
\`\`\`

This documentation follows JSDoc conventions and includes:
- Function description
- Parameter and return type documentation
- Usage example
- Potential errors
- Interface documentation for the return type`
          };
        } else if (userMessage.includes('hello') || userMessage.includes('hi')) {
          response = {
            role: 'assistant',
            content: 'Hello! I\'m your coding assistant. I can help with code explanations, refactoring, finding bugs, writing tests, and documentation. What are you working on today?'
          };
        } else if (userMessage.includes('help')) {
          response = {
            role: 'assistant',
            content: `I can help you with various coding tasks:

1. **Code Explanation**: I can analyze and explain code snippets
2. **Refactoring**: I can suggest improvements to your code
3. **Debugging**: I can help identify and fix bugs
4. **Testing**: I can generate unit tests for your code
5. **Documentation**: I can create documentation for your functions
6. **Best Practices**: I can suggest coding best practices
7. **Learning**: I can explain programming concepts

Just share your code or ask a specific question!`
          };
        } else {
          response = {
            role: 'assistant',
            content: `I received your message. How can I assist with your code today? 

If you're working on a specific problem, you can:
- Share code snippets using triple backticks (\`\`\`)
- Ask specific questions about your code
- Request examples of patterns or techniques

I'm here to help make your coding experience more productive!`
          };
        }
        
        resolve(response);
      }, 1500); // Simulate network delay
    });
  }

  // This would be the actual API call in a production app
  private async callOpenAI(messages: Message[]): Promise<Message> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get response from AI service');
      }

      const data = await response.json();
      return {
        role: 'assistant',
        content: data.choices[0].message.content
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const aiService = new AIService();
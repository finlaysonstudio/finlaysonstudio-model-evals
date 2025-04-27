import { OpenAI, Anthropic, VertexAI } from 'ai';
import { z } from 'zod';

// Model interfaces
export interface ModelClient {
  generateResponse(prompt: string): Promise<string>;
  generateObject<T extends z.ZodType>(schema: T, prompt: string): Promise<z.infer<T>>;
}

export interface StructuredResponse<T> {
  data: T;
  raw?: unknown;
}

export type ModelProvider = 'openai' | 'anthropic' | 'vertex';

// Model configuration
export interface ModelConfig {
  provider: ModelProvider;
  apiKey: string;
  model?: string;
}

// Factory function to create appropriate model client
export function createModelClient(config: ModelConfig): ModelClient {
  switch (config.provider) {
    case 'openai': {
      const openai = new OpenAI({
        apiKey: config.apiKey,
      });
      
      return {
        generateResponse: async (prompt: string) => {
          const response = await openai.completions.create({
            model: config.model || 'gpt-3.5-turbo-instruct',
            prompt,
            max_tokens: 100,
          });
          return response.choices[0]?.text || '';
        },
        generateObject: async <T extends z.ZodType>(schema: T, prompt: string) => {
          const result = await openai.completions.create({
            model: config.model || 'gpt-3.5-turbo-instruct',
            prompt,
            max_tokens: 500,
            response_format: { type: 'json_object' }
          });
          
          const text = result.choices[0]?.text || '{}';
          try {
            const jsonData = JSON.parse(text);
            return schema.parse(jsonData);
          } catch (e) {
            throw new Error(`Failed to parse response as JSON or validate against schema: ${e}`);
          }
        }
      };
    }
    
    case 'anthropic': {
      const anthropic = new Anthropic({
        apiKey: config.apiKey,
      });
      
      return {
        generateResponse: async (prompt: string) => {
          const response = await anthropic.messages.create({
            model: config.model || 'claude-3-haiku-20240307',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100,
          });
          return response.content[0]?.text || '';
        },
        generateObject: async <T extends z.ZodType>(schema: T, prompt: string) => {
          const result = await anthropic.messages.create({
            model: config.model || 'claude-3-haiku-20240307',
            messages: [{ 
              role: 'user', 
              content: `${prompt}\n\nRespond with valid JSON that matches this schema: ${JSON.stringify(schema.shape)}` 
            }],
            max_tokens: 500,
          });
          
          const text = result.content[0]?.text || '{}';
          try {
            const jsonData = JSON.parse(text);
            return schema.parse(jsonData);
          } catch (e) {
            throw new Error(`Failed to parse response as JSON or validate against schema: ${e}`);
          }
        }
      };
    }
    
    case 'vertex': {
      // Since this requires additional project setup, provide a simplified implementation
      return {
        generateResponse: async (prompt: string) => {
          throw new Error('Vertex AI implementation requires project configuration');
        },
        generateObject: async <T extends z.ZodType>(schema: T, prompt: string) => {
          throw new Error('Vertex AI implementation requires project configuration');
        }
      };
    }
    
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
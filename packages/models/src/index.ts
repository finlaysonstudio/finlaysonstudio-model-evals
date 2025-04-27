import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

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
      // Create a custom OpenAI provider with the API key
      const customOpenAI = createOpenAI({
        apiKey: config.apiKey
      });
      
      return {
        generateResponse: async (prompt: string) => {
          const response = await generateObject({
            model: customOpenAI(config.model || 'gpt-4o'),
            prompt,
            schema: z.object({ response: z.string() }),
            mode: 'json'
          });
          
          return response.object.response;
        },
        generateObject: async <T extends z.ZodType>(schema: T, prompt: string) => {
          const result = await generateObject({
            model: customOpenAI(config.model || 'gpt-4o', {
              structuredOutputs: true
            }),
            prompt,
            schema
          });
          
          return result.object;
        }
      };
    }
    
    case 'anthropic': {
      // Create a custom Anthropic provider with the API key
      const customAnthropic = createAnthropic({
        apiKey: config.apiKey
      });
      
      return {
        generateResponse: async (prompt: string) => {
          const response = await generateObject({
            model: customAnthropic(config.model || 'claude-3-sonnet-20240229'),
            prompt,
            schema: z.object({ response: z.string() }),
            mode: 'json'
          });
          
          return response.object.response;
        },
        generateObject: async <T extends z.ZodType>(schema: T, prompt: string) => {
          const result = await generateObject({
            model: customAnthropic(config.model || 'claude-3-sonnet-20240229'),
            prompt,
            schema,
            mode: 'json'
          });
          
          return result.object;
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
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, generateObject } from 'ai';

/**
 * Supported model providers
 */
export type ModelProvider = 'openai' | 'anthropic';

/**
 * Model configuration
 */
export interface ModelConfig {
  provider: ModelProvider;
  apiKey: string;
  modelName?: string;
  baseURL?: string;
}

/**
 * Model client interface
 */
export interface ModelClient {
  generateResponse: (prompt: string) => Promise<string>;
  generateObject: <T extends z.ZodTypeAny>(schema: T, prompt: string) => Promise<z.infer<T>>;
}

/**
 * Default model names for each provider
 */
export const DEFAULT_MODEL_NAMES = {
  openai: 'gpt-4-turbo',
  anthropic: 'claude-3-sonnet-20240229',
};

/**
 * Creates an API client for the specified provider
 * This function is separated to make testing easier
 */
export function createApiClient(config: ModelConfig) {
  const { provider, apiKey, baseURL } = config;
  
  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey, baseURL });
    case 'anthropic':
      return createAnthropic({ apiKey, baseURL });
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Generate text response using the AI SDK
 * This function is separated to make testing easier
 */
export async function generateTextResponse(model: any, prompt: string): Promise<string> {
  const response = await generateText({
    model,
    prompt,
  });
  
  return response.text;
}

/**
 * Generate structured object using the AI SDK
 * This function is separated to make testing easier
 */
export async function generateObjectResponse<T extends z.ZodTypeAny>(
  model: any, 
  schema: T, 
  prompt: string
): Promise<z.infer<T>> {
  const response = await generateObject({
    model,
    prompt,
    schema,
  });
  
  return response.object;
}

/**
 * Creates a model client for the specified provider
 * @param config ModelConfig
 * @returns ModelClient
 */
export function createModelClient(config: ModelConfig): ModelClient {
  const { provider, modelName } = config;

  // Determine the actual model name to use
  const actualModelName = modelName || DEFAULT_MODEL_NAMES[provider];
  
  // Create the appropriate API client
  const apiClient = createApiClient(config);
  
  // Create and return the model client
  return {
    async generateResponse(prompt: string): Promise<string> {
      return generateTextResponse(apiClient(actualModelName), prompt);
    },
    
    async generateObject<T extends z.ZodTypeAny>(schema: T, prompt: string): Promise<z.infer<T>> {
      return generateObjectResponse(apiClient(actualModelName), schema, prompt);
    },
  };
}
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, generateObject, streamText, streamObject } from 'ai';

// Add missing type for generateCompletion
type CompletionResult = { completion: string };

/**
 * Supported model providers
 */
export type ModelProvider = 'openai' | 'anthropic' | 'vertexai' | 'ollama' | 'aws' | 'azure';

/**
 * Model configuration
 */
export interface ModelConfig {
  provider: ModelProvider;
  apiKey: string;
  modelName?: string;
  baseURL?: string;
  region?: string;
  organizationId?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Model client interface
 */
export interface ModelClient {
  generateResponse: (prompt: string) => Promise<string>;
  generateObject: <T extends z.ZodTypeAny>(schema: T, prompt: string) => Promise<z.infer<T>>;
  streamResponse: (prompt: string) => Promise<any>; // Using any to avoid ReadableStream conflicts
  streamObject: <T extends z.ZodTypeAny>(schema: T, prompt: string) => Promise<any>; // Using any to avoid ReadableStream conflicts
  generateCompletion: (prompt: string, options?: { temperature?: number; maxTokens?: number }) => Promise<string>;
}

/**
 * Default model names for each provider
 */
export const DEFAULT_MODEL_NAMES = {
  openai: 'gpt-4-turbo',
  anthropic: 'claude-3-sonnet-20240229',
  vertexai: 'gemini-pro',
  ollama: 'llama3',
  aws: 'amazon.titan-text-express-v1',
  azure: 'gpt-4',
};

/**
 * Creates an API client for the specified provider
 * This function is separated to make testing easier
 */
export function createApiClient(config: ModelConfig) {
  const { provider, apiKey, baseURL, region, organizationId } = config;
  
  switch (provider) {
    case 'openai':
      return createOpenAI({ 
        apiKey, 
        baseURL,
        organization: organizationId
      });
    case 'anthropic':
      return createAnthropic({ 
        apiKey, 
        baseURL 
      });
    case 'vertexai':
      // In a real implementation, we'd import and use the VertexAI client
      // For now, we'll mock this and throw a "not implemented" error
      throw new Error('VertexAI integration not yet implemented. Please install and configure the VertexAI SDK.');
    case 'ollama':
      // In a real implementation, we'd import and use the Ollama client
      throw new Error('Ollama integration not yet implemented. Please install and configure the Ollama SDK.');
    case 'aws':
      // In a real implementation, we'd import and use the AWS client
      throw new Error('AWS integration not yet implemented. Please install and configure the AWS SDK.');
    case 'azure':
      // In a real implementation, we'd use the OpenAI client with Azure endpoints
      throw new Error('Azure integration not yet implemented. Please install and configure the Azure SDK.');
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Generate text response using the AI SDK
 * This function is separated to make testing easier
 */
export async function generateTextResponse(
  model: any, 
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const response = await generateText({
    model,
    prompt,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
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
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<z.infer<T>> {
  const response = await generateObject({
    model,
    prompt,
    schema,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
  });
  
  return response.object;
}

/**
 * Stream text response using the AI SDK
 * This function is separated to make testing easier
 */
export async function streamTextResponse(
  model: any, 
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<any> {
  const response = await streamText({
    model,
    prompt,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
  });
  
  return response;
}

/**
 * Stream structured object using the AI SDK
 * This function is separated to make testing easier
 */
export async function streamObjectResponse<T extends z.ZodTypeAny>(
  model: any, 
  schema: T, 
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<any> {
  const response = await streamObject({
    model,
    prompt,
    schema,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
  });
  
  return response;
}

/**
 * Generate completion using the AI SDK
 * This function is separated to make testing easier
 */
export async function generateCompletionResponse(
  model: any, 
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  // Since generateCompletion isn't available in the AI SDK yet, we'll use generateText as a fallback
  const response = await generateText({
    model,
    prompt,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
  });
  
  return response.text;
}

/**
 * Creates a model client for the specified provider
 * @param config ModelConfig
 * @returns ModelClient
 */
export function createModelClient(config: ModelConfig): ModelClient {
  const { provider, modelName, temperature, maxTokens } = config;

  // Determine the actual model name to use
  const actualModelName = modelName || DEFAULT_MODEL_NAMES[provider];
  
  // Create the appropriate API client
  const apiClient = createApiClient(config);
  
  // Default options
  const defaultOptions = {
    temperature,
    maxTokens
  };
  
  // Create and return the model client
  return {
    async generateResponse(prompt: string): Promise<string> {
      return generateTextResponse(apiClient(actualModelName), prompt, defaultOptions);
    },
    
    async generateObject<T extends z.ZodTypeAny>(schema: T, prompt: string): Promise<z.infer<T>> {
      return generateObjectResponse(apiClient(actualModelName), schema, prompt, defaultOptions);
    },
    
    async streamResponse(prompt: string): Promise<ReadableStream<string>> {
      return streamTextResponse(apiClient(actualModelName), prompt, defaultOptions);
    },
    
    async streamObject<T extends z.ZodTypeAny>(schema: T, prompt: string): Promise<ReadableStream<z.infer<T>>> {
      return streamObjectResponse(apiClient(actualModelName), schema, prompt, defaultOptions);
    },
    
    async generateCompletion(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
      const mergedOptions = {
        ...defaultOptions,
        ...options
      };
      return generateCompletionResponse(apiClient(actualModelName), prompt, mergedOptions);
    },
  };
}
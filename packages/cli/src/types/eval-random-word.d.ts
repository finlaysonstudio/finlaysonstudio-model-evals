declare module '@finlaysonstudio/eval-random-word' {
  export type PromptStyle = 'simple' | 'structured' | 'detailed';

  export interface EvaluationOptions {
    options: string[];
    numRuns: number;
    promptStyle: PromptStyle;
    tracking?: {
      enabled: boolean;
      name: string;
      description: string;
      modelProvider: 'openai' | 'anthropic';
      modelName: string;
    };
  }

  export interface EvaluationResult {
    totalRuns: number;
    selectedWords: Record<string, number>;
    positionBias: Record<string, number>;
  }

  export function evaluateRandomWordSelection(
    modelClient: any,
    options: EvaluationOptions
  ): Promise<EvaluationResult>;
}

declare module '@finlaysonstudio/eval-models' {
  export interface ModelConfig {
    provider: 'openai' | 'anthropic';
    apiKey: string;
    modelName?: string;
  }

  export function connectToDatabase(options: {
    uri: string;
    dbName: string;
  }): Promise<void>;

  export function disconnectFromDatabase(): Promise<void>;

  export function createModelClient(config: ModelConfig): any;
}
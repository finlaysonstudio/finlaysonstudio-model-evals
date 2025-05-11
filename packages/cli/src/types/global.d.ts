// Global declarations for Node.js
declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    NODE_ENV?: 'development' | 'production' | 'test';
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    MONGODB_URI?: string;
  }

  interface Process {
    env: ProcessEnv;
    exit(code?: number): never;
    argv: string[];
  }
}

declare const process: NodeJS.Process;
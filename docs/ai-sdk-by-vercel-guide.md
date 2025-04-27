# Vercel **AI SDK** — Structured-JSON Cheat Sheet  
*A single-fence markdown guide for code generators*

---

## 📦 Install

```bash
pnpm add ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/openrouter zod



⸻

🗂 Shared Schema

// llm/schema.ts
import { z } from "zod";

/** Zod schema for a simple recipe */
export const RecipeSchema = z.object({
  title: z.string(),
  servings: z.number().int().positive(),
  ingredients: z.array(
    z.object({
      item: z.string(),
      quantity: z.string(),
    }),
  ),
  steps: z.array(z.string()),
});

export type Recipe = z.infer<typeof RecipeSchema>;
// generated with 🩶 by chatgpt-4o



⸻

🔌 OpenAI (GPT-4o)

// llm/openai.js
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { RecipeSchema } from "./schema.js";

/**
 * Generate a typed recipe using GPT-4o.
 * @param {string} topic
 * @returns {Promise<import("./schema.js").Recipe>}
 */
const recipeOpenAI = async topic => {
  const { object } = await generateObject({
    model: openai("gpt-4o-2024-04-09", { structuredOutputs: true }),
    prompt: `Write a simple recipe about ${topic}.`,
    schema: RecipeSchema,
  });

  return object;
};

export default recipeOpenAI;
// generated with 🩶 by chatgpt-4o



⸻

🔌 Anthropic (Claude 3)

// llm/anthropic.js
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { RecipeSchema } from "./schema.js";

/**
 * Generate a typed recipe using Claude 3.
 * @param {string} topic
 * @returns {Promise<import("./schema.js").Recipe>}
 */
const recipeAnthropic = async topic => {
  const { object } = await generateObject({
    model: anthropic("claude-3-sonnet-20240229"),
    prompt: `Write a simple recipe about ${topic}.`,
    schema: RecipeSchema,
    mode: "json",
  });

  return object;
};

export default recipeAnthropic;
// generated with 🩶 by chatgpt-4o



⸻

🔌 OpenRouter (Mixtral 8×7B)

// llm/openrouter.js
import { openrouter } from "@ai-sdk/openrouter";
import { generateObject } from "ai";
import { RecipeSchema } from "./schema.js";

/**
 * Generate a typed recipe using OpenRouter (Mixtral 8×7B).
 * @param {string} topic
 * @returns {Promise<import("./schema.js").Recipe>}
 */
const recipeOpenRouter = async topic => {
  const { object } = await generateObject({
    model: openrouter("openrouter/mistralai__mixtral-8x7b", {
      response_format: {
        type: "json_schema",
        json_schema: RecipeSchema.toJSON(), // Zod ➜ JSON Schema
      },
    }),
    prompt: `Write a simple recipe about ${topic}.`,
    schema: RecipeSchema,
    mode: "json",
  });

  return object;
};

export default recipeOpenRouter;
// generated with 🩶 by chatgpt-4o



⸻

🔌 Using Custom API Keys

// llm/custom-providers.js
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { RecipeSchema } from "./schema.js";

/**
 * Generate a recipe using customized providers with API keys
 * @param {string} topic 
 * @param {string} provider - 'openai' or 'anthropic'
 * @param {string} apiKey - Your API key
 * @returns {Promise<import("./schema.js").Recipe>}
 */
export const generateRecipe = async (topic, provider, apiKey) => {
  if (provider === 'openai') {
    const customOpenAI = createOpenAI({ apiKey });
    const { object } = await generateObject({
      model: customOpenAI("gpt-4o", { structuredOutputs: true }),
      prompt: `Write a simple recipe about ${topic}.`,
      schema: RecipeSchema,
    });
    return object;
  } else if (provider === 'anthropic') {
    const customAnthropic = createAnthropic({ apiKey });
    const { object } = await generateObject({
      model: customAnthropic("claude-3-sonnet-20240229"),
      prompt: `Write a simple recipe about ${topic}.`,
      schema: RecipeSchema,
      mode: "json",
    });
    return object;
  }
  throw new Error(`Unsupported provider: ${provider}`);
};
// generated with 🩶 by claude-3



⸻

🚀 Unified Usage Example

import recipeOpenAI from "./llm/openai.js";
import recipeAnthropic from "./llm/anthropic.js";
import recipeOpenRouter from "./llm/openrouter.js";
import { generateRecipe } from "./llm/custom-providers.js";

const demo = async () => {
  console.log(await recipeOpenAI("pasta"));
  console.log(await recipeAnthropic("pasta"));
  console.log(await recipeOpenRouter("pasta"));
  console.log(await generateRecipe("pizza", "openai", process.env.OPENAI_API_KEY));
  console.log(await generateRecipe("salad", "anthropic", process.env.ANTHROPIC_API_KEY));
};

demo();
// generated with 🩶 by chatgpt-4o



⸻

Notes for Generators
	•	All modules use ESM, arrow-function default exports, and retain whitespace.
	•	generateObject() validates provider output against Zod locally—errors throw.
	•	Substitute models or schemas freely; parameter names stay identical.
	•	Works in Node ≥18, Vercel Edge, or any serverless runtime without polyfills.
 • For using custom API keys, use createOpenAI() and createAnthropic() factory functions.

⸻




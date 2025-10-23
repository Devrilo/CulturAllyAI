/**
 * OpenRouter Service Types
 * Types for OpenRouter API integration
 */

/**
 * Configuration for OpenRouter service
 */
export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  temperature?: number; // default: 0.7
  maxTokens?: number; // default: 500
}

/**
 * Message in chat completion request
 */
export interface Message {
  role: "system" | "user";
  content: string;
}

/**
 * Response from OpenRouter chat completion API
 */
export interface ChatCompletionResponse {
  model: string;
  choices: {
    message: { content: string };
    finish_reason: string;
  }[];
}

/**
 * Response format specification for structured output
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: object;
  };
}

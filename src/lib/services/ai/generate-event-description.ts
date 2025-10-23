import type { CreateEventDTO } from "../../../types";
import { OpenRouterService } from "./openrouter.service";

/**
 * Response from AI event description generation
 */
export interface GenerateDescriptionResult {
  description: string;
  modelVersion: string;
}

/**
 * Error thrown when AI generation fails
 */
export class AIGenerationError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 503
  ) {
    super(message);
    this.name = "AIGenerationError";
  }
}

/**
 * Generates event description based on input data
 *
 * @param input - Event data to generate description from
 * @param apiKey - Optional OpenRouter API key (defaults to env variable)
 * @returns Generated description and model version
 * @throws AIGenerationError if generation fails
 */
export async function generateEventDescription(
  input: CreateEventDTO,
  apiKey?: string
): Promise<GenerateDescriptionResult> {
  // Get API key from parameter or environment
  const openRouterKey = apiKey || import.meta.env.OPENROUTER_API_KEY;

  if (!openRouterKey) {
    throw new AIGenerationError("OPENROUTER_API_KEY environment variable is not set", 503);
  }

  // Create a new service instance for each request (stateless)
  const service = new OpenRouterService({
    apiKey: openRouterKey,
    model: "openai/gpt-4o-mini",
  });

  return await service.generateEventDescription(input);
}

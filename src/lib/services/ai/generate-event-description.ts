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

// Singleton instance of OpenRouterService
let service: OpenRouterService | null = null;

/**
 * Get or create OpenRouterService instance
 */
function getService(): OpenRouterService {
  if (!service) {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new AIGenerationError("OPENROUTER_API_KEY environment variable is not set", 503);
    }

    service = new OpenRouterService({
      apiKey,
      model: "openai/gpt-4o-mini",
    });
  }
  return service;
}

/**
 * Generates event description based on input data
 *
 * @param input - Event data to generate description from
 * @returns Generated description and model version
 * @throws AIGenerationError if generation fails
 */
export async function generateEventDescription(input: CreateEventDTO): Promise<GenerateDescriptionResult> {
  return await getService().generateEventDescription(input);
}

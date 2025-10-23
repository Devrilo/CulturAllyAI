import type { CreateEventDTO } from "../../../types";
import type { OpenRouterConfig, Message, ChatCompletionResponse, ResponseFormat } from "./openrouter.types";
import type { GenerateDescriptionResult } from "./generate-event-description";

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
 * Service for generating event descriptions using OpenRouter API
 */
export class OpenRouterService {
  private config: Required<OpenRouterConfig>;
  private readonly BASE_URL = "https://openrouter.ai/api/v1";
  private readonly TIMEOUT = 30000;

  constructor(config: OpenRouterConfig) {
    // Validate API key format
    if (!config.apiKey || !config.apiKey.startsWith("sk-or-v1-")) {
      throw new AIGenerationError("Invalid OpenRouter API key format. Key must start with 'sk-or-v1-'", 401);
    }

    // Set defaults for optional parameters
    this.config = {
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 500,
    };
  }

  /**
   * Generate event description from input data
   * @param input - Event data to generate description from
   * @returns Generated description and model version
   * @throws AIGenerationError if generation fails
   */
  async generateEventDescription(input: CreateEventDTO): Promise<GenerateDescriptionResult> {
    const messages: Message[] = [
      { role: "system", content: this.buildSystemMessage() },
      { role: "user", content: this.buildUserMessage(input) },
    ];

    const response = await this.sendChatCompletion(messages);
    const description = this.parseResponse(response);

    return {
      description,
      modelVersion: response.model,
    };
  }

  /**
   * Build system message with instructions for AI
   */
  private buildSystemMessage(): string {
    return `Jesteś ekspertem od opisów wydarzeń kulturalnych w języku polskim.

Wymagania:
- Poprawna polszczyzna (używaj odpowiednich przypadków gramatycznych)
- Maksymalnie 500 znaków
- Ton profesjonalny, ciepły, zachęcający
- Unikaj generycznych fraz typu "nie przegap okazji", "niezapomniane chwile"
- Struktura: co + gdzie → dlaczego warto → szczegóły

WAŻNE dotyczące lokalizacji:
- Pole "Lokalizacja" może zawierać miasto, dzielnicę, adres, lub nietypowe miejsce
- NIE zakładaj automatycznie, że to nazwa miasta
- Dostosuj opis do kontekstu (np. "u mnie w garażu" → intymna atmosfera, "Warszawa" → standardowe miasto)
- Użyj odpowiedniego przypadka gramatycznego w zależności od typu lokalizacji

Zwróć odpowiedź w formacie JSON: {"description": "tekst opisu"}`;
  }

  /**
   * Build user message with event data
   */
  private buildUserMessage(input: CreateEventDTO): string {
    const eventDateFormatted = new Date(input.event_date).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `Napisz opis wydarzenia:

Tytuł: ${input.title}
Lokalizacja: ${input.city}
Data: ${eventDateFormatted}
Kategoria: ${input.category}
Grupa docelowa: ${input.age_category}
Kluczowe informacje: ${input.key_information}

UWAGA: "Lokalizacja" może być miastem, dzielnicą, adresem lub nietypowym miejscem (np. "u mnie w garażu", "w lokalnym klubie"). Dostosuj opis do kontekstu lokalizacji.`;
  }

  /**
   * Build response format specification for structured output
   */
  private buildResponseFormat(): ResponseFormat {
    return {
      type: "json_schema",
      json_schema: {
        name: "event_description",
        strict: true,
        schema: {
          type: "object",
          properties: {
            description: { type: "string", maxLength: 500 },
          },
          required: ["description"],
          additionalProperties: false,
        },
      },
    };
  }

  /**
   * Send chat completion request to OpenRouter API
   * Implements retry logic with exponential backoff for transient errors
   */
  private async sendChatCompletion(messages: Message[]): Promise<ChatCompletionResponse> {
    const url = `${this.BASE_URL}/chat/completions`;
    const body = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      response_format: this.buildResponseFormat(),
    };

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.TIMEOUT);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          const message = error.error?.message || `HTTP ${response.status}`;
          const statusCode = response.status >= 500 ? 503 : response.status;
          throw new AIGenerationError(message, statusCode);
        }

        return await response.json();
      } catch (error) {
        // Don't retry for 4xx errors (client errors)
        if (error instanceof AIGenerationError && error.statusCode < 500) {
          throw error;
        }

        // Retry with exponential backoff for 5xx and timeout errors
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          continue;
        }

        // Re-throw error after max retries
        if (error instanceof Error) {
          throw new AIGenerationError(error.message, 503);
        }
        throw new AIGenerationError("Unknown error occurred", 503);
      }
    }

    throw new AIGenerationError("Max retries exceeded", 503);
  }

  /**
   * Parse response from OpenRouter API
   * Validates that description meets the 500 character limit
   * @param response - API response
   * @returns Parsed description text
   * @throws AIGenerationError if parsing fails or description exceeds limit
   */
  private parseResponse(response: ChatCompletionResponse): string {
    // Validate response structure
    if (!response.choices || response.choices.length === 0) {
      throw new AIGenerationError("Invalid API response: no choices returned", 503);
    }

    const choice = response.choices[0];

    // Check finish reason
    if (choice.finish_reason !== "stop") {
      throw new AIGenerationError(`Generation incomplete: ${choice.finish_reason}`, 503);
    }

    // Parse JSON content
    try {
      const content = choice.message.content;
      const parsed = JSON.parse(content);

      if (!parsed.description || typeof parsed.description !== "string") {
        throw new AIGenerationError("Invalid response format: missing description field", 503);
      }

      // Validate 500 character limit - model MUST respect this
      if (parsed.description.length > 500) {
        throw new AIGenerationError(
          `Generated description exceeds 500 character limit (${parsed.description.length} characters)`,
          503
        );
      }

      return parsed.description;
    } catch (error) {
      if (error instanceof AIGenerationError) {
        throw error;
      }
      throw new AIGenerationError("Failed to parse API response as JSON", 503);
    }
  }
}

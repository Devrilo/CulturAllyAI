# OpenRouter Service - Plan Implementacji

## Cel

Zastąpienie mock implementacji w `generate-event-description.ts` prawdziwym wywołaniem OpenRouter API.

**Wybrany model:** `openai/gpt-4o-mini`

- Koszt: ~$0.15/1M input tokens, ~$0.60/1M output tokens
- Bardzo dobra jakość w języku polskim
- Świetny balans cena/jakość dla generowania krótkich opisów

---

## 1. Typy (`openrouter.types.ts`)

```typescript
export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  temperature?: number; // default: 0.7
  maxTokens?: number; // default: 500
}

export interface Message {
  role: "system" | "user";
  content: string;
}

export interface ChatCompletionResponse {
  model: string;
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: object;
  };
}
```

---

## 2. Klasa OpenRouterService (`openrouter.service.ts`)

### Pola prywatne

```typescript
private config: Required<OpenRouterConfig>;
private readonly BASE_URL = "https://openrouter.ai/api/v1";
private readonly TIMEOUT = 30000;
```

### Konstruktor

```typescript
constructor(config: OpenRouterConfig) {
  // 1. Waliduj apiKey (sprawdź czy zaczyna się od "sk-or-v1-")
  // 2. Ustaw domyślne: temperature: 0.7, maxTokens: 500
}
```

### Główna metoda

```typescript
async generateEventDescription(input: CreateEventDTO): Promise<GenerateDescriptionResult> {
  const messages = [
    { role: "system", content: this.buildSystemMessage() },
    { role: "user", content: this.buildUserMessage(input) }
  ];

  const response = await this.sendChatCompletion(messages);
  const description = this.parseResponse(response);

  return {
    description: this.trimTo500(description),
    modelVersion: response.model
  };
}
```

---

## 3. Metody Pomocnicze

### `buildSystemMessage(): string`

```
Jesteś ekspertem od opisów wydarzeń kulturalnych w języku polskim.

Wymagania:
- Poprawna polszczyzna (miasta w miejscowniku, grupy wiekowe w dopełniaczu)
- Max 500 znaków
- Ton profesjonalny, ciepły, zachęcający
- Bez fraz typu "nie przegap okazji"
- Struktura: co+gdzie → dlaczego warto → szczegóły
```

### `buildUserMessage(input: CreateEventDTO): string`

```
Napisz opis wydarzenia:

Tytuł: {input.title}
Miasto: {input.city}
Data: {formatowana data PL}
Kategoria: {input.category}
Grupa docelowa: {input.age_category}
Kluczowe informacje: {input.key_information}
```

### `buildResponseFormat(): ResponseFormat`

```typescript
{
  type: "json_schema",
  json_schema: {
    name: "event_description",
    strict: true,
    schema: {
      type: "object",
      properties: {
        description: { type: "string", maxLength: 500 }
      },
      required: ["description"]
    }
  }
}
```

### `sendChatCompletion(messages: Message[]): Promise<ChatCompletionResponse>`

```typescript
// POST https://openrouter.ai/api/v1/chat/completions
// Headers:
//   - Authorization: Bearer {apiKey}
//   - Content-Type: application/json
// Body:
//   - model, messages, temperature, max_tokens, response_format
// Timeout: 30s z AbortController
// Retry: max 2 próby, exponential backoff (1s, 2s)
// Throw AIGenerationError dla błędów 4xx/5xx
```

### `parseResponse(response: ChatCompletionResponse): string`

```typescript
// Sprawdź czy response.choices[0] istnieje
// Sprawdź finish_reason === "stop"
// Parsuj JSON z response.choices[0].message.content
// Zwróć parsed.description
// Throw AIGenerationError przy błędach
```

---

## 4. Obsługa Błędów

```typescript
export class AIGenerationError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 503
  ) {
    super(message);
    this.name = "AIGenerationError";
  }
}
```

**Scenariusze:**

- **401:** Brak/zły API key → waliduj w konstruktorze
- **4xx:** Błędy klienta → rzuć błąd BEZ retry
- **5xx/timeout:** Błędy serwera → retry 2x (backoff: 1s, 2s)
- **JSON parse error:** → `AIGenerationError(message, 503)`

---

## 5. Plan Wdrożenia

### Krok 1: Stwórz `openrouter.types.ts`

Skopiuj interfejsy z sekcji 1.

### Krok 2: Stwórz `openrouter.service.ts`

1. Import typów i `AIGenerationError`
2. Zaimplementuj konstruktor z walidacją
3. Zaimplementuj 3 metody build\* (system message, user message, response format)
4. Zaimplementuj `sendChatCompletion()` z fetch, timeout i retry
5. Zaimplementuj `parseResponse()`
6. Zaimplementuj główną metodę `generateEventDescription()`

### Krok 3: Zaktualizuj `generate-event-description.ts`

```typescript
import { OpenRouterService } from "./openrouter.service";
export { AIGenerationError } from "./openrouter.service";

let service: OpenRouterService | null = null;

function getService() {
  if (!service) {
    service = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY,
      model: "openai/gpt-4o-mini", // Tani (~$0.15/1M tokens), dobry w polszczyźnie
    });
  }
  return service;
}

export async function generateEventDescription(input: CreateEventDTO) {
  return await getService().generateEventDescription(input);
}
```

### Krok 4: Test

Uruchom `npm run dev` i wywołaj POST `/api/events` z danymi testowymi.

---

## Przykład Implementacji `sendChatCompletion`

```typescript
private async sendChatCompletion(messages: Message[]): Promise<ChatCompletionResponse> {
  const url = `${this.BASE_URL}/chat/completions`;
  const body = {
    model: this.config.model,
    messages,
    temperature: this.config.temperature,
    max_tokens: this.config.maxTokens,
    response_format: this.buildResponseFormat()
  };

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: controller.signal
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
      // Nie retry dla 4xx
      if (error instanceof AIGenerationError && error.statusCode < 500) {
        throw error;
      }

      // Retry z backoff
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }

      throw error;
    }
  }

  throw new AIGenerationError("Max retries exceeded", 503);
}
```

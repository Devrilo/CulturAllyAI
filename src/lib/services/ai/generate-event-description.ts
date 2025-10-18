import type { CreateEventDTO } from "../../../types";

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
 * MOCK IMPLEMENTATION - Returns predefined description for development
 * TODO: Replace with real OpenRouter API call in production
 *
 * @param input - Event data to generate description from
 * @returns Generated description and model version
 * @throws AIGenerationError if generation fails
 */
export async function generateEventDescription(input: CreateEventDTO): Promise<GenerateDescriptionResult> {
  // TODO: Replace with real OpenRouter API call
  // When implementing real AI generation, use the prompt template below:
  //
  // PROMPT TEMPLATE FOR AI:
  // ```
  // Napisz krótki, angażujący opis wydarzenia kulturalnego (max 500 znaków).
  //
  // Wymagania:
  // - Używaj poprawnej polszczyzny z odpowiednimi odmianami przez przypadki
  // - Ton: profesjonalny, ciepły, zachęcający
  // - Unikaj generycznych fraz typu "nie przegap okazji", "niezapomniane chwile"
  // - Skup się na konkretach: co, gdzie, dla kogo, dlaczego warto przyjść
  // - Jeśli to konieczne, dodaj kontekst kulturowy
  //
  // Dane wydarzenia:
  // - Tytuł: {input.title}
  // - Miasto: {input.city} (używaj właściwego przypadka - miejscownik!)
  // - Data: {input.event_date}
  // - Kategoria: {input.category}
  // - Grupa docelowa: {input.age_category} (używaj właściwego przypadka - dopełniacz!)
  // - Kluczowe informacje: {input.key_information}
  //
  // Struktura:
  // 1. Pierwsze zdanie: Co to za wydarzenie + podstawowe info
  // 2. Drugie zdanie: Dlaczego warto / co wyróżnia
  // 3. Praktyczne szczegóły z key_information
  // ```

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock implementation with improved grammar and structure
  const cityInLocative = getCityLocative(input.city);
  const ageCategoryGenitive = getAgeCategoryGenitive(input.age_category);
  const eventDateFormatted = new Date(input.event_date).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mockDescription =
    `${input.title} odbędzie się ${cityInLocative} ${eventDateFormatted}. To wydarzenie skierowane jest przede wszystkim do ${ageCategoryGenitive}. ${input.key_information}`.trim();

  // Trim to max 500 characters as per requirements
  const trimmedDescription = mockDescription.length > 500 ? mockDescription.substring(0, 497) + "..." : mockDescription;

  // Mock model version from env (fallback to static value)
  const modelVersion = import.meta.env.AI_MODEL_VERSION || "mock-v1.0.0";

  return {
    description: trimmedDescription,
    modelVersion,
  };
}

/**
 * Converts city name to locative case (miejscownik)
 * Simple implementation - for production, consider using a proper Polish grammar library
 */
function getCityLocative(city: string): string {
  // Common Polish cities in locative case
  const locatives: Record<string, string> = {
    Warszawa: "w Warszawie",
    Kraków: "w Krakowie",
    Poznań: "w Poznaniu",
    Wrocław: "we Wrocławiu",
    Gdańsk: "w Gdańsku",
    Łódź: "w Łodzi",
    Katowice: "w Katowicach",
    Szczecin: "w Szczecinie",
    Gdynia: "w Gdyni",
    Lublin: "w Lublinie",
    Bydgoszcz: "w Bydgoszczy",
    Białystok: "w Białymstoku",
    Toruń: "w Toruniu",
    Rzeszów: "w Rzeszowie",
  };

  // Return known locative or fallback to "w {city}"
  return locatives[city] || `w ${city}`;
}

/**
 * Converts age category to genitive case (dopełniacz)
 * Used in phrases like "dla {genitive}"
 */
function getAgeCategoryGenitive(category: string): string {
  const genitives: Record<string, string> = {
    wszystkie: "wszystkich grup wiekowych",
    najmlodsi: "najmłodszych dzieci",
    dzieci: "dzieci",
    nastolatkowie: "nastolatków",
    mlodzi_dorosli: "młodych dorosłych",
    dorosli: "dorosłych",
    osoby_starsze: "osób starszych",
  };

  return genitives[category] || category;
}

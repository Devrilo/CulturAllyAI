# Plan Implementacji Serwera MCP - CulturAllyAI

## 1. Struktura Projektu

```
CulturAllyAI-MCP-Server/
├── src/
│   ├── index.ts                    # Entry point, server setup, stdio transport
│   ├── tools/
│   │   ├── definitions.ts          # Tool schemas (name, description, inputSchema)
│   │   └── handlers.ts             # Tool execution logic
│   ├── utils/
│   │   ├── validators.ts           # Zod validation schemas (skopiowane z CulturAllyAI)
│   │   ├── formatters.ts           # MCP response formatters
│   │   ├── categories.ts           # Static categories data
│   │   └── date-helpers.ts         # Date formatting utilities
│   └── __tests__/
│       ├── get-event-categories.test.ts
│       ├── get-age-categories.test.ts
│       ├── validate-event-data.test.ts
│       └── format-event-date.test.ts
├── dist/                           # Compiled TypeScript output
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── wrangler.toml                   # Cloudflare Workers configuration
├── .gitignore
└── README.md                       # Dokumentacja użycia i deployment
```

## 2. Kluczowe Moduły

### **`src/index.ts`**

Inicjalizacja serwera MCP z transportem stdio i rejestracją narzędzi:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { toolDefinitions } from './tools/definitions.js';
import { handleToolCall } from './tools/handlers.js';

// Konfiguracja serwera
const server = new Server(
  {
    name: 'culturallyai-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Rejestracja handlera dla listy narzędzi
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions,
}));

// Rejestracja handlera dla wywołań narzędzi
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const result = await handleToolCall(name, args);
    return result;
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            tool: name,
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start serwera z transportem stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CulturAllyAI MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
```

**Funkcje:**
- Inicjalizacja instancji `Server` z metadanymi (name, version)
- Rejestracja capabilities (tylko `tools` w MVP)
- Obsługa `ListToolsRequestSchema` - zwraca tablicę definicji narzędzi
- Obsługa `CallToolRequestSchema` - routing do odpowiednich handlerów
- Globalna obsługa błędów z formatowaniem dla MCP SDK
- Transport stdio dla komunikacji z klientami MCP (Claude Desktop, Inspector)

---

### **`src/tools/definitions.ts`**

Definicje schematów wszystkich narzędzi MCP:

```typescript
import { z } from 'zod';

/**
 * Tool definitions compatible with MCP SDK
 * Each tool includes name, description, and Zod input schema
 */
export const toolDefinitions = [
  {
    name: 'get-event-categories',
    description: 'Zwraca listę dostępnych kategorii wydarzeń kulturalnych z polskimi etykietami (8 kategorii: koncerty, imprezy, teatr i taniec, sztuka i wystawy, literatura, kino, festiwale, inne)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get-age-categories',
    description: 'Zwraca listę dostępnych kategorii wiekowych z polskimi etykietami i zakresami wieku (7 kategorii: wszystkie, najmłodsi 0-3, dzieci 4-12, nastolatkowie 13-17, młodzi dorośli 18-35, dorośli 36-64, osoby starsze 65+)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'validate-event-data',
    description: 'Waliduje dane wydarzenia kulturalnego przed utworzeniem/zapisem. Sprawdza wymagane pola, długości stringów (tytuł 1-100, miasto 1-50, kluczowe info 1-200 znaków), format daty ISO 8601, wartości kategorii i age_category z enum. Zwraca valid:true z znormalizowanymi danymi lub valid:false z szczegółowymi błędami per pole.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Tytuł wydarzenia (1-100 znaków)',
        },
        city: {
          type: 'string',
          description: 'Miasto wydarzenia (1-50 znaków)',
        },
        event_date: {
          type: 'string',
          description: 'Data wydarzenia w formacie ISO 8601 (np. 2025-12-25T19:00:00Z), musi być dzisiaj lub w przyszłości',
        },
        category: {
          type: 'string',
          description: 'Kategoria wydarzenia: koncerty|imprezy|teatr_i_taniec|sztuka_i_wystawy|literatura|kino|festiwale|inne',
        },
        age_category: {
          type: 'string',
          description: 'Kategoria wiekowa: wszystkie|najmlodsi|dzieci|nastolatkowie|mlodzi_dorosli|dorosli|osoby_starsze',
        },
        key_information: {
          type: 'string',
          description: 'Kluczowe informacje o wydarzeniu (1-200 znaków)',
        },
      },
      required: ['title', 'city', 'event_date', 'category', 'age_category', 'key_information'],
    },
  },
  {
    name: 'format-event-date',
    description: 'Konwertuje datę ISO 8601 (np. 2025-12-25T19:00:00Z) na format YYYY-MM-DD używany w bazie danych. Waliduje format wejściowy i zwraca sformatowaną datę lub błąd.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Data w formacie ISO 8601 (np. 2025-12-25T19:00:00Z)',
        },
      },
      required: ['date'],
    },
  },
];

// Export Zod schemas for type safety in handlers
export const validateEventDataSchema = z.object({
  title: z.string(),
  city: z.string(),
  event_date: z.string(),
  category: z.string(),
  age_category: z.string(),
  key_information: z.string(),
});

export const formatEventDateSchema = z.object({
  date: z.string(),
});
```

**Funkcje:**
- Tablica definicji narzędzi zgodna z MCP SDK
- Każde narzędzie: `name`, `description`, `inputSchema` (JSON Schema format)
- Opisy w języku polskim dla lepszej UX z AI asystentami
- Export schematów Zod dla walidacji w handlerach

---

### **`src/tools/handlers.ts`**

Logika wykonywania narzędzi MCP:

```typescript
import { 
  getEventCategories, 
  getAgeCategories 
} from '../utils/categories.js';
import { validateEventData } from '../utils/validators.js';
import { formatEventDate } from '../utils/date-helpers.js';
import { formatMcpResponse, formatMcpError } from '../utils/formatters.js';
import { 
  validateEventDataSchema, 
  formatEventDateSchema 
} from './definitions.js';

/**
 * Routes tool calls to appropriate handlers
 * @param name - Tool name
 * @param args - Tool arguments (unvalidated)
 * @returns MCP-formatted response
 */
export async function handleToolCall(
  name: string, 
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case 'get-event-categories':
      return handleGetEventCategories();
    
    case 'get-age-categories':
      return handleGetAgeCategories();
    
    case 'validate-event-data':
      return handleValidateEventData(args);
    
    case 'format-event-date':
      return handleFormatEventDate(args);
    
    default:
      return formatMcpError(`Unknown tool: ${name}`);
  }
}

/**
 * Handler: get-event-categories
 * Returns static list of 8 event categories
 */
function handleGetEventCategories() {
  const categories = getEventCategories();
  return formatMcpResponse({ categories });
}

/**
 * Handler: get-age-categories
 * Returns static list of 7 age categories
 */
function handleGetAgeCategories() {
  const categories = getAgeCategories();
  return formatMcpResponse({ categories });
}

/**
 * Handler: validate-event-data
 * Validates event data using Zod schema from CulturAllyAI
 */
function handleValidateEventData(args: unknown) {
  try {
    // Step 1: Validate input structure
    const input = validateEventDataSchema.parse(args);
    
    // Step 2: Validate event data with business rules
    const result = validateEventData(input);
    
    return formatMcpResponse(result);
  } catch (error) {
    if (error instanceof Error) {
      return formatMcpError(error.message, { tool: 'validate-event-data' });
    }
    return formatMcpError('Validation failed', { tool: 'validate-event-data' });
  }
}

/**
 * Handler: format-event-date
 * Converts ISO 8601 to YYYY-MM-DD format
 */
function handleFormatEventDate(args: unknown) {
  try {
    // Step 1: Validate input structure
    const input = formatEventDateSchema.parse(args);
    
    // Step 2: Format date
    const result = formatEventDate(input.date);
    
    return formatMcpResponse(result);
  } catch (error) {
    if (error instanceof Error) {
      return formatMcpError(error.message, { tool: 'format-event-date' });
    }
    return formatMcpError('Date formatting failed', { tool: 'format-event-date' });
  }
}
```

**Funkcje:**
- Centralny router `handleToolCall()` dla wszystkich narzędzi
- Osobne handlery dla każdego narzędzia z izolacją błędów
- Walidacja parametrów wejściowych przez Zod przed wykonaniem
- Delegacja logiki biznesowej do modułów utils
- Formatowanie odpowiedzi przez `formatMcpResponse()` / `formatMcpError()`
- Try-catch dla każdego handlera z graceful error handling

---

### **`src/utils/categories.ts`**

Statyczne dane kategorii (skopiowane z CulturAllyAI):

```typescript
/**
 * Static categories data for CulturAllyAI MCP Server
 * Copied from CulturAllyAI src/lib/services/categories.service.ts
 */

export interface CategoryDTO {
  value: string;
  label: string;
}

const AGE_CATEGORY_LABELS: Record<string, string> = {
  wszystkie: "Wszystkie",
  najmlodsi: "Najmłodsi (0-3 lata)",
  dzieci: "Dzieci (4-12 lat)",
  nastolatkowie: "Nastolatkowie (13-17 lat)",
  mlodzi_dorosli: "Młodzi dorośli (18-35 lat)",
  dorosli: "Dorośli (36-64 lata)",
  osoby_starsze: "Osoby starsze (65+ lat)",
};

export function getAgeCategories(): CategoryDTO[] {
  return Object.entries(AGE_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
}

const EVENT_CATEGORY_LABELS: Record<string, string> = {
  koncerty: "Koncerty",
  imprezy: "Imprezy",
  teatr_i_taniec: "Teatr i taniec",
  sztuka_i_wystawy: "Sztuka i wystawy",
  literatura: "Literatura",
  kino: "Kino",
  festiwale: "Festiwale",
  inne: "Inne",
};

export function getEventCategories(): CategoryDTO[] {
  return Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
}
```

**Funkcje:**
- Wbudowane statyczne dane kategorii (brak dostępu do bazy danych)
- Funkcje `getEventCategories()` i `getAgeCategories()` z CulturAllyAI
- TypeScript interfaces dla type safety
- Zero dependencies - czyste dane + transformacje

---

### **`src/utils/validators.ts`**

Walidacja danych wydarzeń (Zod schemas skopiowane z CulturAllyAI):

```typescript
import { z } from 'zod';

/**
 * Event validation schema (copied from CulturAllyAI)
 * src/lib/validators/events.ts - createEventSchema
 */

// Event category enum
const eventCategoryEnum = z.enum([
  'koncerty',
  'imprezy',
  'teatr_i_taniec',
  'sztuka_i_wystawy',
  'literatura',
  'kino',
  'festiwale',
  'inne',
], {
  errorMap: () => ({ message: 'Nieprawidłowa kategoria wydarzenia' }),
});

// Age category enum
const ageCategoryEnum = z.enum([
  'wszystkie',
  'najmlodsi',
  'dzieci',
  'nastolatkowie',
  'mlodzi_dorosli',
  'dorosli',
  'osoby_starsze',
], {
  errorMap: () => ({ message: 'Nieprawidłowa kategoria wiekowa' }),
});

// Main event validation schema
export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, 'Tytuł jest wymagany')
    .max(100, 'Tytuł nie może przekraczać 100 znaków')
    .trim(),
  city: z
    .string()
    .min(1, 'Miasto jest wymagane')
    .max(50, 'Miasto nie może przekraczać 50 znaków')
    .trim(),
  event_date: z
    .string()
    .datetime({ message: 'Data musi być w formacie ISO 8601' })
    .refine(
      (date) => {
        const eventDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
      },
      { message: 'Data wydarzenia nie może być w przeszłości' }
    ),
  category: eventCategoryEnum,
  age_category: ageCategoryEnum,
  key_information: z
    .string()
    .min(1, 'Kluczowe informacje są wymagane')
    .max(200, 'Kluczowe informacje nie mogą przekraczać 200 znaków')
    .trim(),
});

export type EventValidationInput = z.infer<typeof createEventSchema>;

/**
 * Validates event data and returns structured result
 */
export function validateEventData(input: EventValidationInput): {
  valid: boolean;
  data?: EventValidationInput;
  errors?: Record<string, string[]>;
} {
  try {
    const validatedData = createEventSchema.parse(input);
    return {
      valid: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    return {
      valid: false,
      errors: {
        _general: ['Nieznany błąd walidacji'],
      },
    };
  }
}
```

**Funkcje:**
- Schemat Zod `createEventSchema` skopiowany z CulturAllyAI
- Wszystkie reguły walidacji: długości, formaty, enum values, custom refine dla dat
- Funkcja `validateEventData()` zwracająca strukturalny wynik
- Format błędów: `{ valid: false, errors: { field: [messages] } }`
- Format sukcesu: `{ valid: true, data: validatedObject }`

---

### **`src/utils/date-helpers.ts`**

Utility do formatowania dat (skopiowane z CulturAllyAI):

```typescript
/**
 * Date formatting utilities (copied from CulturAllyAI)
 * src/lib/utils/date-helpers.ts
 */

/**
 * Converts ISO datetime string to date-only format (YYYY-MM-DD)
 * @param isoDateTime - ISO 8601 datetime string (e.g., "2024-12-25T00:00:00.000Z")
 * @returns Date-only string (e.g., "2024-12-25")
 */
export function fromISODateTime(isoDateTime: string): string {
  if (!isoDateTime) return '';
  return isoDateTime.split('T')[0];
}

/**
 * Validates and formats event date for MCP tool
 * @param date - ISO 8601 datetime string
 * @returns Object with formatted date or error
 */
export function formatEventDate(date: string): {
  formatted?: string;
  original?: string;
  error?: string;
  details?: string;
} {
  try {
    // Validate ISO 8601 format
    if (!date || typeof date !== 'string') {
      return {
        error: 'Invalid date format',
        details: 'Date must be a non-empty string',
      };
    }

    // Try to parse as Date
    const parsedDate = new Date(date);
    
    // Check if valid date
    if (isNaN(parsedDate.getTime())) {
      return {
        error: 'Invalid date format',
        details: 'Expected ISO 8601 string (e.g., 2025-12-25T19:00:00Z)',
      };
    }

    // Format to YYYY-MM-DD
    const formatted = fromISODateTime(date);

    return {
      formatted,
      original: date,
    };
  } catch (error) {
    return {
      error: 'Date formatting failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Funkcje:**
- `fromISODateTime()` - konwersja ISO 8601 → YYYY-MM-DD
- `formatEventDate()` - wrapper z walidacją i error handling
- Zwraca `{ formatted, original }` lub `{ error, details }`
- Obsługa edge cases: puste stringi, niepoprawne formaty, NaN dates

---

### **`src/utils/formatters.ts`**

Formatowanie odpowiedzi dla MCP SDK:

```typescript
/**
 * MCP response formatters
 * Ensures all tool responses follow MCP SDK structure
 */

/**
 * Formats successful tool response for MCP SDK
 * @param data - Response data (will be JSON stringified)
 * @returns MCP-formatted response object
 */
export function formatMcpResponse(data: unknown): {
  content: Array<{ type: string; text: string }>;
} {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Formats error response for MCP SDK
 * @param message - Error message
 * @param details - Optional error details
 * @returns MCP-formatted error response
 */
export function formatMcpError(
  message: string,
  details?: Record<string, unknown>
): {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
} {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            error: message,
            ...details,
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}
```

**Funkcje:**
- `formatMcpResponse()` - opakowuje dane w `{ content: [{ type, text }] }`
- `formatMcpError()` - dodatkowo ustawia `isError: true`
- JSON.stringify z pretty printing (2 spaces) dla czytelności w AI asystentach
- Centralizacja formatowania - łatwa zmiana struktury w przyszłości

---

## 3. Definicje Narzędzi/Zasobów/Promptów

### **Narzędzie: `get-event-categories`**

- **Opis:** Zwraca listę 8 kategorii wydarzeń kulturalnych z polskimi etykietami (koncerty, imprezy, teatr i taniec, sztuka i wystawy, literatura, kino, festiwale, inne)

- **Schemat Wejściowy (Zod):** 
  ```typescript
  z.object({}) // Brak parametrów
  ```

- **Schemat Wyjściowy (Zod):**
  ```typescript
  z.object({
    categories: z.array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    ),
  })
  ```

- **Logika `execute`:**
  1. Wywołanie `getEventCategories()` z `utils/categories.ts`
  2. Zwrócenie statycznej tablicy 8 kategorii
  3. Formatowanie przez `formatMcpResponse({ categories })`
  
- **Opakowanie Wyniku dla SDK:**
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "{\"categories\":[{\"value\":\"koncerty\",\"label\":\"Koncerty\"}...]}"
      }
    ]
  }
  ```

---

### **Narzędzie: `get-age-categories`**

- **Opis:** Zwraca listę 7 kategorii wiekowych z polskimi etykietami i zakresami wieku (wszystkie, najmłodsi 0-3, dzieci 4-12, nastolatkowie 13-17, młodzi dorośli 18-35, dorośli 36-64, osoby starsze 65+)

- **Schemat Wejściowy (Zod):**
  ```typescript
  z.object({}) // Brak parametrów
  ```

- **Schemat Wyjściowy (Zod):**
  ```typescript
  z.object({
    categories: z.array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    ),
  })
  ```

- **Logika `execute`:**
  1. Wywołanie `getAgeCategories()` z `utils/categories.ts`
  2. Zwrócenie statycznej tablicy 7 kategorii
  3. Formatowanie przez `formatMcpResponse({ categories })`

- **Opakowanie Wyniku dla SDK:**
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "{\"categories\":[{\"value\":\"wszystkie\",\"label\":\"Wszystkie\"}...]}"
      }
    ]
  }
  ```

---

### **Narzędzie: `validate-event-data`**

- **Opis:** Waliduje dane wydarzenia kulturalnego przed utworzeniem/zapisem. Sprawdza wymagane pola, długości stringów (tytuł 1-100, miasto 1-50, kluczowe info 1-200 znaków), format daty ISO 8601, wartości kategorii i age_category z enum. Zwraca valid:true z znormalizowanymi danymi lub valid:false z szczegółowymi błędami per pole.

- **Schemat Wejściowy (Zod):**
  ```typescript
  z.object({
    title: z.string(),
    city: z.string(),
    event_date: z.string(),
    category: z.string(),
    age_category: z.string(),
    key_information: z.string(),
  })
  ```

- **Schemat Wyjściowy (Zod):**
  ```typescript
  // Sukces
  z.object({
    valid: z.literal(true),
    data: z.object({
      title: z.string(),
      city: z.string(),
      event_date: z.string(),
      category: z.string(),
      age_category: z.string(),
      key_information: z.string(),
    }),
  })
  
  // Błąd
  z.object({
    valid: z.literal(false),
    errors: z.record(z.string(), z.array(z.string())),
  })
  ```

- **Logika `execute`:**
  1. Walidacja struktury parametrów przez `validateEventDataSchema.parse(args)`
  2. Wywołanie `validateEventData(input)` z `utils/validators.ts`
  3. Schemat Zod `createEventSchema` waliduje:
     - `title`: trim, 1-100 znaków
     - `city`: trim, 1-50 znaków
     - `event_date`: ISO 8601 format, dzisiaj lub przyszłość (custom refine)
     - `category`: enum 8 wartości
     - `age_category`: enum 7 wartości
     - `key_information`: trim, 1-200 znaków
  4. Zwrócenie `{ valid: true, data }` lub `{ valid: false, errors }`
  5. Formatowanie przez `formatMcpResponse(result)`
  6. Obsługa wyjątków: catch ZodError → return formatMcpError

- **Opakowanie Wyniku dla SDK:**
  ```json
  // Sukces
  {
    "content": [
      {
        "type": "text",
        "text": "{\"valid\":true,\"data\":{\"title\":\"Koncert\",\"city\":\"Warszawa\"...}}"
      }
    ]
  }
  
  // Błąd
  {
    "content": [
      {
        "type": "text",
        "text": "{\"valid\":false,\"errors\":{\"title\":[\"Tytuł nie może przekraczać 100 znaków\"],\"event_date\":[\"Data wydarzenia nie może być w przeszłości\"]}}"
      }
    ]
  }
  ```

---

### **Narzędzie: `format-event-date`**

- **Opis:** Konwertuje datę ISO 8601 (np. 2025-12-25T19:00:00Z) na format YYYY-MM-DD używany w bazie danych. Waliduje format wejściowy i zwraca sformatowaną datę lub błąd.

- **Schemat Wejściowy (Zod):**
  ```typescript
  z.object({
    date: z.string(),
  })
  ```

- **Schemat Wyjściowy (Zod):**
  ```typescript
  // Sukces
  z.object({
    formatted: z.string(),
    original: z.string(),
  })
  
  // Błąd
  z.object({
    error: z.string(),
    details: z.string(),
  })
  ```

- **Logika `execute`:**
  1. Walidacja struktury parametrów przez `formatEventDateSchema.parse(args)`
  2. Wywołanie `formatEventDate(input.date)` z `utils/date-helpers.ts`
  3. Walidacja:
     - Sprawdzenie czy date jest non-empty string
     - Parsowanie przez `new Date(date)`
     - Sprawdzenie czy `isNaN(parsedDate.getTime())`
  4. Formatowanie przez `fromISODateTime()` (split na 'T', wzięcie pierwszej części)
  5. Zwrócenie `{ formatted, original }` lub `{ error, details }`
  6. Formatowanie przez `formatMcpResponse(result)`
  7. Obsługa wyjątków: catch → return formatMcpError

- **Opakowanie Wyniku dla SDK:**
  ```json
  // Sukces
  {
    "content": [
      {
        "type": "text",
        "text": "{\"formatted\":\"2025-12-25\",\"original\":\"2025-12-25T19:00:00Z\"}"
      }
    ]
  }
  
  // Błąd
  {
    "content": [
      {
        "type": "text",
        "text": "{\"error\":\"Invalid date format\",\"details\":\"Expected ISO 8601 string\"}"
      }
    ]
  }
  ```

---

## 4. Obsługa Danych

### Źródła danych

- **Kategorie wydarzeń i wiekowe:** Statyczne dane wbudowane w `src/utils/categories.ts`
  - Brak połączenia z bazą danych
  - Dane skopiowane z `CulturAllyAI/src/lib/services/categories.service.ts`
  - Zero latency - natychmiastowe odpowiedzi (<1ms)

- **Walidacja:** Schematy Zod w `src/utils/validators.ts`
  - Skopiowane z `CulturAllyAI/src/lib/validators/events.ts`
  - Operacje w pamięci - szybkie (<10ms)

- **Formatowanie dat:** Logika w `src/utils/date-helpers.ts`
  - Skopiowana z `CulturAllyAI/src/lib/utils/date-helpers.ts`
  - Czyste funkcje bez side-effects

### Brak external dependencies

- Żadnych API calls
- Żadnych połączeń z bazą danych
- Żadnych secrets/environment variables
- Całkowita bezstanowość

---

## 5. Konfiguracja Serwera i Wdrożenia

### Konfiguracja `McpServer`

```typescript
const server = new Server(
  {
    name: 'culturallyai-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
```

**Parametry:**
- `name`: Identyfikator serwera dla klientów MCP
- `version`: Wersja serwera (semantic versioning)
- `capabilities.tools`: Pusta tablica - narzędzia rejestrowane przez `ListToolsRequestSchema`

### Konfiguracja `wrangler.toml`

```toml
name = "culturallyai-mcp-server"
main = "dist/index.js"
compatibility_date = "2024-09-25"
compatibility_flags = ["nodejs_compat"]

[observability]
enabled = true
```

**Parametry:**
- `name`: Nazwa projektu w Cloudflare Workers
- `main`: Entry point po kompilacji TypeScript
- `compatibility_date`: Data kompatybilności Workers Runtime
- `compatibility_flags`: `nodejs_compat` dla Node.js APIs (Buffer, process, etc.)
- `observability.enabled`: Włącza logowanie i monitoring w Cloudflare dashboard

### Zmienne Środowiskowe / Sekrety

**MVP nie wymaga żadnych zmiennych środowiskowych:**
- Brak dostępu do bazy danych (Supabase)
- Brak generowania AI (OpenRouter)
- Brak autentykacji (JWT tokens)

**Dla przyszłych rozszerzeń (poza MVP):**
- `OPENROUTER_API_KEY`: Klucz API dla generowania opisów AI (dodać przez `wrangler secret put`)
- `SUPABASE_URL` / `SUPABASE_KEY`: Dostęp do bazy danych (jeśli będzie potrzebny read-only)

---

## 6. Obsługa Błędów

### Strategia implementacji

**3 poziomy obsługi błędów:**

1. **Globalny handler w `index.ts`:**
   ```typescript
   server.setRequestHandler(CallToolRequestSchema, async (request) => {
     try {
       const result = await handleToolCall(name, args);
       return result;
     } catch (error) {
       return {
         content: [{
           type: 'text',
           text: JSON.stringify({
             error: error instanceof Error ? error.message : 'Unknown error',
             tool: name,
           }),
         }],
         isError: true,
       };
     }
   });
   ```

2. **Handler-level try-catch w `handlers.ts`:**
   ```typescript
   function handleValidateEventData(args: unknown) {
     try {
       const input = validateEventDataSchema.parse(args);
       const result = validateEventData(input);
       return formatMcpResponse(result);
     } catch (error) {
       if (error instanceof Error) {
         return formatMcpError(error.message, { tool: 'validate-event-data' });
       }
       return formatMcpError('Validation failed', { tool: 'validate-event-data' });
     }
   }
   ```

3. **Zod validation errors w `validators.ts`:**
   ```typescript
   export function validateEventData(input: EventValidationInput) {
     try {
       const validatedData = createEventSchema.parse(input);
       return { valid: true, data: validatedData };
     } catch (error) {
       if (error instanceof z.ZodError) {
         return {
           valid: false,
           errors: error.flatten().fieldErrors,
         };
       }
       return {
         valid: false,
         errors: { _general: ['Nieznany błąd walidacji'] },
       };
     }
   }
   ```

### Format komunikatów błędów

**Błędy walidacji (Zod):**
```json
{
  "valid": false,
  "errors": {
    "title": ["Tytuł nie może przekraczać 100 znaków"],
    "event_date": ["Data wydarzenia nie może być w przeszłości"],
    "category": ["Nieprawidłowa kategoria wydarzenia"]
  }
}
```

**Błędy runtime (MCP SDK format):**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\":\"Unknown tool: invalid-tool-name\",\"tool\":\"invalid-tool-name\"}"
    }
  ],
  "isError": true
}
```

### Logowanie

- Wszystkie błędy logowane przez `console.error()` w Cloudflare Workers
- Dostępne w Real-time Logs w Cloudflare dashboard
- Format: `[ERROR] Tool: {toolName} | Message: {errorMessage}`

---

## 7. Strategia Testowania

### Testy Jednostkowe (Vitest)

**Lokalizacja:** `src/__tests__/`

**Test files:**
- `get-event-categories.test.ts`
- `get-age-categories.test.ts`
- `validate-event-data.test.ts`
- `format-event-date.test.ts`

**Przykład testu dla `get-event-categories`:**
```typescript
import { describe, it, expect } from 'vitest';
import { getEventCategories } from '../utils/categories';

describe('get-event-categories', () => {
  it('should return 8 event categories', () => {
    const categories = getEventCategories();
    expect(categories).toHaveLength(8);
  });

  it('should return categories with value and label', () => {
    const categories = getEventCategories();
    categories.forEach((cat) => {
      expect(cat).toHaveProperty('value');
      expect(cat).toHaveProperty('label');
      expect(typeof cat.value).toBe('string');
      expect(typeof cat.label).toBe('string');
    });
  });

  it('should include expected categories', () => {
    const categories = getEventCategories();
    const values = categories.map((c) => c.value);
    expect(values).toContain('koncerty');
    expect(values).toContain('teatr_i_taniec');
    expect(values).toContain('festiwale');
  });
});
```

**Pokrycie testów:**
- Poprawne wejście → oczekiwane wyjście
- Niepoprawne wejście → odpowiednie błędy
- Walidacja formatów odpowiedzi MCP SDK
- Edge cases (puste stringi, nieprawidłowe daty, długie teksty)

**Uruchomienie:**
```bash
npm test                # Wszystkie testy
npm run test:watch      # Watch mode
npm run test:coverage   # Raport pokrycia
```

**Docelowe pokrycie:** 80%+ (zgodnie z praktykami CulturAllyAI)

### Testy Integracyjne (MCP Inspector)

**Tool:** `npx @modelcontextprotocol/inspector@latest`

**Test scenarios:**

1. **Lista narzędzi:**
   ```bash
   npx @modelcontextprotocol/inspector dist/index.js
   # Weryfikacja: 4 narzędzia (get-event-categories, get-age-categories, validate-event-data, format-event-date)
   ```

2. **get-event-categories:**
   - Wywołanie bez parametrów
   - Oczekiwane: 8 kategorii z value/label
   - Czas odpowiedzi: <50ms

3. **get-age-categories:**
   - Wywołanie bez parametrów
   - Oczekiwane: 7 kategorii z value/label
   - Czas odpowiedzi: <50ms

4. **validate-event-data - sukces:**
   - Parametry: poprawne dane wydarzenia
   - Oczekiwane: `{ valid: true, data: {...} }`
   - Weryfikacja: znormalizowane dane (trim whitespace)

5. **validate-event-data - błędy:**
   - Parametry: tytuł 101 znaków, data w przeszłości, niepoprawna kategoria
   - Oczekiwane: `{ valid: false, errors: {...} }`
   - Weryfikacja: szczegółowe błędy per pole

6. **format-event-date - sukces:**
   - Parametry: `{ date: "2025-12-25T19:00:00Z" }`
   - Oczekiwane: `{ formatted: "2025-12-25", original: "..." }`

7. **format-event-date - błąd:**
   - Parametry: `{ date: "invalid" }`
   - Oczekiwane: `{ error: "...", details: "..." }`

**Dokumentacja w README:**
- Szczegółowe instrukcje krok po kroku
- Przykładowe wywołania z MCP Inspector
- Oczekiwane wyniki dla każdego scenariusza
- Troubleshooting częstych problemów

### Testy E2E (opcjonalnie, poza MVP)

- Integracja z Claude Desktop (konfiguracja `claude_desktop_config.json`)
- Weryfikacja workflow: AI asystent → MCP tool → odpowiedź → AI asystent
- Testy konwersacji: "Wygeneruj dane wydarzenia dla koncertu w Warszawie"

---

## 8. Dodatkowe Uwagi

### Decyzje projektowe

1. **Całkowite oddzielenie od CulturAllyAI:**
   - Nowe repozytorium bez importów z głównego projektu
   - Kod skopiowany, nie współdzielony
   - Zero wpływu na działającą aplikację

2. **Minimalistyczny zakres MVP:**
   - Tylko 4 narzędzia read-only
   - Brak generowania AI (koszty, złożoność)
   - Brak dostępu do bazy danych (bezpieczeństwo, stan)

3. **TypeScript strict mode:**
   - Wszystkie flagi strict z głównego projektu
   - Type safety dla parametrów narzędzi i odpowiedzi
   - Wykrywanie błędów na etapie kompilacji

4. **Polskie komunikaty błędów:**
   - Spójność z aplikacją CulturAllyAI
   - Lepsze UX dla polskojęzycznych AI asystentów
   - Czytelność w MCP Inspector

### Potencjalne ryzyka

1. **Zależność od MCP SDK:**
   - SDK może zmienić API w przyszłości
   - Mitygacja: Pinowanie wersji w package.json

2. **Cloudflare Workers limitations:**
   - CPU time limit: 10ms (free), 30ms (paid)
   - Mitygacja: Wszystkie operacje <10ms w MVP

3. **Brak wersjonowania narzędzi:**
   - Breaking changes wymagają nowej wersji serwera
   - Mitygacja: Semantic versioning w `Server({ version })`

4. **Polskie znaki w stdio transport:**
   - Potencjalne problemy z kodowaniem UTF-8
   - Mitygacja: Testy integracyjne z MCP Inspector

### Przyszłe rozszerzenia (poza MVP)

1. **Narzędzie `generate-event-description`:**
   - Integracja z OpenRouter API
   - Environment variable: `OPENROUTER_API_KEY`
   - Timeout handling dla długich requestów

2. **Rate limiting:**
   - Middleware z licznikiem wywołań per IP/user agent
   - Limity: 10 wywołań/minutę, 100/godzinę

3. **Cachowanie:**
   - Cache dla `get-event-categories` / `get-age-categories`
   - Workers KV storage dla wyników generowania AI

4. **Monitoring i analytics:**
   - Cloudflare Workers Analytics
   - Custom metrics: calls per tool, error rates, latency

5. **CI/CD pipeline:**
   - GitHub Actions: `.github/workflows/mcp-server.yml`
   - Kroki: lint → test → build → deploy (wrangler)

---

**Plan gotowy do implementacji!** 🚀

Następny krok: Utworzenie struktury projektu i implementacja narzędzi MCP zgodnie z tym planem.

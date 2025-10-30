# Propozycja Refaktoryzacji Domenowej - CulturAllyAI

## 1. Wstęp

Dokument zawiera kompleksową analizę i propozycję refaktoryzacji aplikacji CulturAllyAI w oparciu o zasady Domain-Driven Design (DDD). Celem jest poprawa utrzymywalności, czytelności i skalowalności kodu poprzez wyodrębnienie jasno zdefiniowanych domen biznesowych.

## 2. Analiza Obecnej Architektury

### 2.1 Problemy Identyfikowane

1. **Rozproszenie logiki biznesowej** - serwisy zawierają zarówno logikę domenową, jak i infrastrukturę
2. **Brak jasnych granic kontekstowych** - mieszanie odpowiedzialności (generowanie AI + zarządzanie wydarzeniami)
3. **Anemic Domain Model** - DTOs/Entities bez zachowań, cała logika w serwisach
4. **Tight coupling** - silne powiązania między warstwami (API → Service → DB)
5. **Brak walidacji domenowej** - walidacja tylko na poziomie HTTP/formularzy
6. **Duplikacja logiki** - powtarzanie reguł biznesowych w różnych miejscach

### 2.2 Obecna Struktura (uproszczona)

```
src/
├── types.ts                 # Wszystkie typy zmieszane
├── components/              # UI + logika prezentacji
├── lib/
│   ├── services/           # Logika biznesowa + infrastruktura
│   │   ├── events.service.ts
│   │   ├── categories.service.ts
│   │   └── ai/
│   └── validators/         # Walidacja tylko inputów HTTP
└── pages/api/              # Endpoints + orchestracja
```

## 3. Identyfikacja Bounded Contexts (Wzorzec Strategiczny)

Na podstawie PRD i analizy kodu, identyfikujemy następujące **Bounded Contexts**:

### 3.1 Event Generation Context (Generowanie Wydarzeń)

**Odpowiedzialność:**
- Tworzenie opisów wydarzeń przez AI
- Generowanie treści na podstawie danych użytkownika
- Zarządzanie promptami i wersjami modeli
- Śledzenie jakości generacji

**Język wszechobecny (Ubiquitous Language):**
- **Event Draft** - wersja robocza wydarzenia przed generacją
- **AI Generation** - proces generowania opisu
- **Generation Quality** - jakość wygenerowanej treści
- **Model Version** - wersja modelu AI użytego do generacji
- **Prompt Template** - szablon promptu dla AI

### 3.2 Event Management Context (Zarządzanie Wydarzeniami)

**Odpowiedzialność:**
- Zarządzanie cyklem życia wydarzeń
- Zapisywanie i edycja wydarzeń użytkownika
- Organizacja i filtrowanie wydarzeń
- Soft delete i archiwizacja

**Język wszechobecny:**
- **Event** - kompletne wydarzenie kulturalne
- **Saved Event** - zapisane przez użytkownika wydarzenie
- **Event Owner** - właściciel wydarzenia
- **Event Collection** - kolekcja wydarzeń użytkownika
- **Event Archive** - archiwum usuniętych wydarzeń

### 3.3 Event Feedback Context (Feedback i Oceny)

**Odpowiedzialność:**
- Zbieranie ocen od użytkowników (kciuk w górę/dół)
- Analiza jakości rekomendacji
- Metryki trafności AI

**Język wszechobecny:**
- **Rating** - ocena wydarzenia
- **Feedback** - opinia użytkownika
- **Quality Metric** - metryka jakości
- **User Satisfaction** - satysfakcja użytkownika

### 3.4 Identity & Access Context (Tożsamość i Dostęp)

**Odpowiedzialność:**
- Autentykacja użytkowników (delegowana do Supabase)
- Autoryzacja operacji
- Zarządzanie sesjami
- Audit log aktywności

**Język wszechobecny:**
- **User** - użytkownik systemu
- **Guest User** - użytkownik anonimowy
- **Authenticated User** - użytkownik zalogowany
- **Session** - sesja użytkownika
- **Activity Log** - log aktywności

### 3.5 Shared Kernel (Współdzielone Jądro)

**Odpowiedzialność:**
- Wspólne typy danych (kategorie, daty)
- Value Objects używane w wielu kontekstach
- Wspólne reguły walidacji

**Współdzielone koncepty:**
- **EventCategory** - kategoria wydarzenia
- **AgeCategory** - kategoria wiekowa
- **DateRange** - zakres dat
- **Description** - opis tekstowy

## 4. Context Map (Mapa Relacji Między Kontekstami)

```
┌──────────────────────────────┐
│   Event Generation Context   │
│   (Generowanie Wydarzeń)     │
└──────────┬───────────────────┘
           │
           │ Upstream
           │ (Published Language)
           │
           ↓ Downstream
┌──────────────────────────────┐
│  Event Management Context    │
│  (Zarządzanie Wydarzeniami)  │
└──────────┬───────────────────┘
           │
           │ Customer/Supplier
           │
           ↓
┌──────────────────────────────┐
│   Event Feedback Context     │
│   (Feedback i Oceny)         │
└──────────────────────────────┘

           ↑
           │ Conformist
           │
┌──────────┴───────────────────┐
│  Identity & Access Context   │
│  (Tożsamość i Dostęp)        │
└──────────────────────────────┘

           ↑
           │ Shared Kernel
           │
┌──────────┴───────────────────┐
│      Shared Kernel           │
│ (Value Objects, Commons)     │
└──────────────────────────────┘
```

### Typy Relacji:

- **Published Language** (Event Generation → Event Management): Generation publikuje standardowy format EventDTO
- **Customer/Supplier** (Event Management → Feedback): Management dostarcza dane, Feedback je konsumuje
- **Conformist** (Wszystkie → Identity): Wszystkie konteksty dostosowują się do modelu Supabase Auth
- **Shared Kernel** (Wszystkie → Shared): Wspólne Value Objects i typy bazowe

## 5. Wzorce Taktyczne DDD - Przykład: Event Management Context

Pokażemy kompleksową refaktoryzację kontekstu **Event Management** jako wzór dla pozostałych.

### 5.1 Warstwa Domenowa (Domain Layer)

#### 5.1.1 Value Objects

```typescript
// src/domains/event-management/domain/value-objects/EventId.ts

/**
 * Value Object: EventId
 * Reprezentuje unikalny identyfikator wydarzenia
 * Immutable, self-validating
 */
export class EventId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): EventId {
    if (!value || value.trim().length === 0) {
      throw new DomainError("EventId cannot be empty");
    }

    // Walidacja formatu UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new DomainError("EventId must be a valid UUID");
    }

    return new EventId(value);
  }

  static generate(): EventId {
    return new EventId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: EventId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

```typescript
// src/domains/event-management/domain/value-objects/Description.ts

/**
 * Value Object: Description
 * Reprezentuje opis wydarzenia z regułami biznesowymi
 */
export class Description {
  private static readonly MAX_LENGTH = 500;
  private static readonly MIN_LENGTH = 10;
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Description {
    const trimmed = value.trim();

    if (trimmed.length < Description.MIN_LENGTH) {
      throw new DomainError(
        `Description must be at least ${Description.MIN_LENGTH} characters`
      );
    }

    if (trimmed.length > Description.MAX_LENGTH) {
      throw new DomainError(
        `Description cannot exceed ${Description.MAX_LENGTH} characters`
      );
    }

    return new Description(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  getLength(): number {
    return this.value.length;
  }

  getRemainingCharacters(): number {
    return Description.MAX_LENGTH - this.value.length;
  }

  equals(other: Description): boolean {
    return this.value === other.value;
  }
}
```

```typescript
// src/domains/event-management/domain/value-objects/EventDate.ts

/**
 * Value Object: EventDate
 * Reprezentuje datę wydarzenia z regułami biznesowymi
 */
export class EventDate {
  private readonly value: Date;

  private constructor(value: Date) {
    this.value = value;
  }

  static create(value: string | Date): EventDate {
    const date = typeof value === "string" ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      throw new DomainError("Invalid date format");
    }

    // Reguła biznesowa: wydarzenia z przeszłości można dodawać tylko do 7 dni wstecz
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (date < sevenDaysAgo) {
      throw new DomainError("Event date cannot be more than 7 days in the past");
    }

    return new EventDate(date);
  }

  static now(): EventDate {
    return new EventDate(new Date());
  }

  getValue(): Date {
    return new Date(this.value); // Zwracamy kopię dla immutability
  }

  toISOString(): string {
    return this.value.toISOString();
  }

  isInFuture(): boolean {
    return this.value > new Date();
  }

  isInPast(): boolean {
    return this.value < new Date();
  }

  daysUntilEvent(): number {
    const now = new Date();
    const diff = this.value.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  equals(other: EventDate): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}
```

#### 5.1.2 Entity: Event Aggregate

```typescript
// src/domains/event-management/domain/entities/Event.ts

import { EventId } from "../value-objects/EventId";
import { Description } from "../value-objects/Description";
import { EventDate } from "../value-objects/EventDate";
import { UserId } from "../../../shared/domain/value-objects/UserId";
import { EventCategory, AgeCategory } from "../../../shared/domain/value-objects/Categories";
import { Feedback } from "../value-objects/Feedback";
import { DomainEvent } from "../../../shared/domain/events/DomainEvent";
import { EventSavedDomainEvent } from "../events/EventSavedDomainEvent";
import { EventRatedDomainEvent } from "../events/EventRatedDomainEvent";
import { EventEditedDomainEvent } from "../events/EventEditedDomainEvent";

/**
 * Aggregate Root: Event
 * Reprezentuje wydarzenie kulturalne w systemie
 * Enkapsuluje wszystkie reguły biznesowe związane z wydarzeniem
 */
export class Event {
  private readonly id: EventId;
  private readonly ownerId: UserId | null;
  private readonly createdByAuthenticatedUser: boolean;
  private title: string;
  private city: string;
  private eventDate: EventDate;
  private category: EventCategory;
  private ageCategory: AgeCategory;
  private keyInformation: string;
  private generatedDescription: Description;
  private editedDescription: Description | null;
  private saved: boolean;
  private feedback: Feedback | null;
  private modelVersion: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  // Domain Events - do publikacji po zapisie
  private domainEvents: DomainEvent[] = [];

  private constructor(props: EventProps) {
    this.id = props.id;
    this.ownerId = props.ownerId;
    this.createdByAuthenticatedUser = props.createdByAuthenticatedUser;
    this.title = props.title;
    this.city = props.city;
    this.eventDate = props.eventDate;
    this.category = props.category;
    this.ageCategory = props.ageCategory;
    this.keyInformation = props.keyInformation;
    this.generatedDescription = props.generatedDescription;
    this.editedDescription = props.editedDescription || null;
    this.saved = props.saved || false;
    this.feedback = props.feedback || null;
    this.modelVersion = props.modelVersion;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  /**
   * Factory method - tworzenie nowego wydarzenia
   */
  static create(props: CreateEventProps): Event {
    const event = new Event({
      id: EventId.generate(),
      ownerId: props.ownerId,
      createdByAuthenticatedUser: props.isAuthenticated,
      title: props.title,
      city: props.city,
      eventDate: EventDate.create(props.eventDate),
      category: props.category,
      ageCategory: props.ageCategory,
      keyInformation: props.keyInformation,
      generatedDescription: Description.create(props.generatedDescription),
      editedDescription: null,
      saved: false,
      feedback: null,
      modelVersion: props.modelVersion,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return event;
  }

  /**
   * Factory method - rekonstrukcja z persistencji
   */
  static reconstitute(props: EventProps): Event {
    return new Event(props);
  }

  /**
   * Reguła biznesowa: Zapisywanie wydarzenia
   * Tylko zalogowani użytkownicy mogą zapisywać wydarzenia
   */
  save(): void {
    if (!this.ownerId) {
      throw new DomainError("Guest users cannot save events");
    }

    if (this.saved) {
      throw new DomainError("Event is already saved");
    }

    this.saved = true;
    this.updatedAt = new Date();

    // Publikuj domain event
    this.addDomainEvent(
      new EventSavedDomainEvent({
        eventId: this.id.getValue(),
        userId: this.ownerId.getValue(),
        occurredAt: new Date(),
      })
    );
  }

  /**
   * Reguła biznesowa: Usuwanie zapisu (soft delete)
   * Tylko właściciel może usunąć swoje wydarzenie
   */
  unsave(): void {
    if (!this.saved) {
      throw new DomainError("Event is not saved");
    }

    if (!this.createdByAuthenticatedUser) {
      throw new DomainError("Cannot unsave events created by guests");
    }

    this.saved = false;
    this.updatedAt = new Date();
  }

  /**
   * Reguła biznesowa: Ocena wydarzenia
   * Można ocenić tylko raz
   */
  rate(feedback: Feedback): void {
    if (!this.ownerId) {
      throw new DomainError("Guest users cannot rate events");
    }

    if (this.feedback !== null) {
      throw new DomainError("Event has already been rated");
    }

    this.feedback = feedback;
    this.updatedAt = new Date();

    // Publikuj domain event
    this.addDomainEvent(
      new EventRatedDomainEvent({
        eventId: this.id.getValue(),
        userId: this.ownerId.getValue(),
        feedback: feedback.getValue(),
        occurredAt: new Date(),
      })
    );
  }

  /**
   * Reguła biznesowa: Edycja opisu
   * Tylko właściciel może edytować
   */
  editDescription(newDescription: string): void {
    if (!this.createdByAuthenticatedUser) {
      throw new DomainError("Cannot edit events created by guests");
    }

    if (!this.ownerId) {
      throw new DomainError("Guest users cannot edit events");
    }

    const description = Description.create(newDescription);

    // Reguła biznesowa: nie można "edytować" na ten sam opis
    if (this.editedDescription && this.editedDescription.equals(description)) {
      throw new DomainError("New description is the same as current");
    }

    this.editedDescription = description;
    this.updatedAt = new Date();

    // Publikuj domain event
    this.addDomainEvent(
      new EventEditedDomainEvent({
        eventId: this.id.getValue(),
        userId: this.ownerId.getValue(),
        occurredAt: new Date(),
      })
    );
  }

  /**
   * Reguła biznesowa: Przywrócenie oryginalnego opisu
   */
  restoreOriginalDescription(): void {
    if (!this.editedDescription) {
      throw new DomainError("No edited description to restore");
    }

    this.editedDescription = null;
    this.updatedAt = new Date();
  }

  /**
   * Pomocnicza metoda: Czy wydarzenie należy do użytkownika?
   */
  isOwnedBy(userId: UserId): boolean {
    if (!this.ownerId) return false;
    return this.ownerId.equals(userId);
  }

  /**
   * Pomocnicza metoda: Aktualny wyświetlany opis
   */
  getCurrentDescription(): Description {
    return this.editedDescription || this.generatedDescription;
  }

  // Domain Events management
  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // Getters (immutable access)
  getId(): EventId {
    return this.id;
  }

  getOwnerId(): UserId | null {
    return this.ownerId;
  }

  getTitle(): string {
    return this.title;
  }

  getCity(): string {
    return this.city;
  }

  getEventDate(): EventDate {
    return this.eventDate;
  }

  getCategory(): EventCategory {
    return this.category;
  }

  getAgeCategory(): AgeCategory {
    return this.ageCategory;
  }

  getKeyInformation(): string {
    return this.keyInformation;
  }

  getGeneratedDescription(): Description {
    return this.generatedDescription;
  }

  getEditedDescription(): Description | null {
    return this.editedDescription;
  }

  isSaved(): boolean {
    return this.saved;
  }

  getFeedback(): Feedback | null {
    return this.feedback;
  }

  getModelVersion(): string {
    return this.modelVersion;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  isCreatedByAuthenticatedUser(): boolean {
    return this.createdByAuthenticatedUser;
  }
}

// Props types
interface EventProps {
  id: EventId;
  ownerId: UserId | null;
  createdByAuthenticatedUser: boolean;
  title: string;
  city: string;
  eventDate: EventDate;
  category: EventCategory;
  ageCategory: AgeCategory;
  keyInformation: string;
  generatedDescription: Description;
  editedDescription: Description | null;
  saved: boolean;
  feedback: Feedback | null;
  modelVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateEventProps {
  ownerId: UserId | null;
  isAuthenticated: boolean;
  title: string;
  city: string;
  eventDate: string;
  category: EventCategory;
  ageCategory: AgeCategory;
  keyInformation: string;
  generatedDescription: string;
  modelVersion: string;
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
```

#### 5.1.3 Domain Events

```typescript
// src/domains/event-management/domain/events/EventSavedDomainEvent.ts

import { DomainEvent } from "../../../shared/domain/events/DomainEvent";

export class EventSavedDomainEvent extends DomainEvent {
  readonly eventId: string;
  readonly userId: string;

  constructor(props: { eventId: string; userId: string; occurredAt: Date }) {
    super(props.occurredAt);
    this.eventId = props.eventId;
    this.userId = props.userId;
  }

  getEventName(): string {
    return "EventSaved";
  }
}
```

#### 5.1.4 Repository Interface (Port)

```typescript
// src/domains/event-management/domain/repositories/IEventRepository.ts

import { Event } from "../entities/Event";
import { EventId } from "../value-objects/EventId";
import { UserId } from "../../../shared/domain/value-objects/UserId";

/**
 * Repository Interface (Port) - definiuje kontrakt dla persistencji
 * Implementacja będzie w Infrastructure Layer
 */
export interface IEventRepository {
  /**
   * Znajdź wydarzenie po ID
   */
  findById(id: EventId): Promise<Event | null>;

  /**
   * Znajdź wszystkie zapisane wydarzenia użytkownika
   */
  findSavedByUser(userId: UserId, filters?: EventFilters): Promise<Event[]>;

  /**
   * Zapisz nowe wydarzenie
   */
  save(event: Event): Promise<void>;

  /**
   * Aktualizuj istniejące wydarzenie
   */
  update(event: Event): Promise<void>;

  /**
   * Usuń wydarzenie (soft delete w tej domenie)
   */
  delete(id: EventId): Promise<void>;

  /**
   * Sprawdź czy wydarzenie należy do użytkownika
   */
  existsByIdAndUserId(id: EventId, userId: UserId): Promise<boolean>;
}

export interface EventFilters {
  category?: string;
  ageCategory?: string;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "event_date" | "title";
  sortOrder?: "asc" | "desc";
}
```

### 5.2 Warstwa Aplikacji (Application Layer)

#### 5.2.1 Use Cases (Application Services)

```typescript
// src/domains/event-management/application/use-cases/SaveEventUseCase.ts

import { IEventRepository } from "../../domain/repositories/IEventRepository";
import { EventId } from "../../domain/value-objects/EventId";
import { UserId } from "../../../shared/domain/value-objects/UserId";
import { IEventManagementLogger } from "../ports/IEventManagementLogger";
import { DomainEventPublisher } from "../../../shared/application/events/DomainEventPublisher";

/**
 * Use Case: Zapisanie wydarzenia przez użytkownika
 * Application Service - orchestruje operację domenową
 */
export class SaveEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly logger: IEventManagementLogger,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async execute(command: SaveEventCommand): Promise<SaveEventResult> {
    try {
      // 1. Walidacja inputu (Application-level)
      const eventId = EventId.create(command.eventId);
      const userId = UserId.create(command.userId);

      // 2. Pobranie Aggregate z repozytorium
      const event = await this.eventRepository.findById(eventId);

      if (!event) {
        throw new ApplicationError("Event not found", 404);
      }

      // 3. Sprawdzenie uprawnień (Application-level concern)
      if (!event.isOwnedBy(userId)) {
        throw new ApplicationError("User does not own this event", 403);
      }

      // 4. Wykonanie operacji domenowej (Domain logic)
      event.save(); // Tutaj dzieje się magia - reguły domenowe

      // 5. Persist zmian
      await this.eventRepository.update(event);

      // 6. Publikacja Domain Events (Integration Events)
      const domainEvents = event.getDomainEvents();
      for (const domainEvent of domainEvents) {
        await this.eventPublisher.publish(domainEvent);
      }
      event.clearDomainEvents();

      // 7. Logging (Cross-cutting concern)
      await this.logger.logEventSaved(eventId.getValue(), userId.getValue());

      // 8. Zwracamy wynik
      return {
        success: true,
        eventId: eventId.getValue(),
      };
    } catch (error) {
      // Error handling
      if (error instanceof DomainError) {
        throw new ApplicationError(error.message, 400);
      }
      throw error;
    }
  }
}

export interface SaveEventCommand {
  eventId: string;
  userId: string;
}

export interface SaveEventResult {
  success: boolean;
  eventId: string;
}

export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
```

```typescript
// src/domains/event-management/application/use-cases/RateEventUseCase.ts

/**
 * Use Case: Ocena wydarzenia przez użytkownika
 */
export class RateEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly logger: IEventManagementLogger,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async execute(command: RateEventCommand): Promise<RateEventResult> {
    try {
      const eventId = EventId.create(command.eventId);
      const userId = UserId.create(command.userId);
      const feedback = Feedback.create(command.feedback);

      const event = await this.eventRepository.findById(eventId);

      if (!event) {
        throw new ApplicationError("Event not found", 404);
      }

      if (!event.isOwnedBy(userId)) {
        throw new ApplicationError("User does not own this event", 403);
      }

      // Logika domenowa - reguły biznesowe w agregacie
      event.rate(feedback);

      await this.eventRepository.update(event);

      // Publikacja domain events
      const domainEvents = event.getDomainEvents();
      for (const domainEvent of domainEvents) {
        await this.eventPublisher.publish(domainEvent);
      }
      event.clearDomainEvents();

      await this.logger.logEventRated(eventId.getValue(), userId.getValue());

      return {
        success: true,
        eventId: eventId.getValue(),
        feedback: feedback.getValue(),
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw new ApplicationError(error.message, 400);
      }
      throw error;
    }
  }
}

export interface RateEventCommand {
  eventId: string;
  userId: string;
  feedback: "thumbs_up" | "thumbs_down";
}

export interface RateEventResult {
  success: boolean;
  eventId: string;
  feedback: string;
}
```

```typescript
// src/domains/event-management/application/use-cases/EditEventDescriptionUseCase.ts

/**
 * Use Case: Edycja opisu wydarzenia
 */
export class EditEventDescriptionUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly logger: IEventManagementLogger,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async execute(command: EditEventDescriptionCommand): Promise<EditEventDescriptionResult> {
    try {
      const eventId = EventId.create(command.eventId);
      const userId = UserId.create(command.userId);

      const event = await this.eventRepository.findById(eventId);

      if (!event) {
        throw new ApplicationError("Event not found", 404);
      }

      if (!event.isOwnedBy(userId)) {
        throw new ApplicationError("User does not own this event", 403);
      }

      // Logika domenowa
      event.editDescription(command.newDescription);

      await this.eventRepository.update(event);

      // Publikacja domain events
      const domainEvents = event.getDomainEvents();
      for (const domainEvent of domainEvents) {
        await this.eventPublisher.publish(domainEvent);
      }
      event.clearDomainEvents();

      await this.logger.logEventEdited(eventId.getValue(), userId.getValue());

      return {
        success: true,
        eventId: eventId.getValue(),
        description: event.getCurrentDescription().getValue(),
      };
    } catch (error) {
      if (error instanceof DomainError) {
        throw new ApplicationError(error.message, 400);
      }
      throw error;
    }
  }
}

export interface EditEventDescriptionCommand {
  eventId: string;
  userId: string;
  newDescription: string;
}

export interface EditEventDescriptionResult {
  success: boolean;
  eventId: string;
  description: string;
}
```

```typescript
// src/domains/event-management/application/use-cases/GetUserEventsUseCase.ts

/**
 * Use Case: Pobranie wydarzeń użytkownika z filtrami
 * Query Use Case - nie modyfikuje stanu
 */
export class GetUserEventsUseCase {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(query: GetUserEventsQuery): Promise<GetUserEventsResult> {
    const userId = UserId.create(query.userId);

    const events = await this.eventRepository.findSavedByUser(userId, {
      category: query.category,
      ageCategory: query.ageCategory,
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy || "created_at",
      sortOrder: query.sortOrder || "desc",
    });

    // Mapowanie do DTO (Application concern)
    const eventsDTO = events.map((event) => this.mapToDTO(event));

    return {
      events: eventsDTO,
      total: events.length,
      page: query.page || 1,
      limit: query.limit || 20,
    };
  }

  private mapToDTO(event: Event): EventDTO {
    return {
      id: event.getId().getValue(),
      title: event.getTitle(),
      city: event.getCity(),
      eventDate: event.getEventDate().toISOString(),
      category: event.getCategory().getValue(),
      ageCategory: event.getAgeCategory().getValue(),
      keyInformation: event.getKeyInformation(),
      description: event.getCurrentDescription().getValue(),
      saved: event.isSaved(),
      feedback: event.getFeedback()?.getValue() || null,
      createdAt: event.getCreatedAt().toISOString(),
      updatedAt: event.getUpdatedAt().toISOString(),
    };
  }
}

export interface GetUserEventsQuery {
  userId: string;
  category?: string;
  ageCategory?: string;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "event_date" | "title";
  sortOrder?: "asc" | "desc";
}

export interface GetUserEventsResult {
  events: EventDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface EventDTO {
  id: string;
  title: string;
  city: string;
  eventDate: string;
  category: string;
  ageCategory: string;
  keyInformation: string;
  description: string;
  saved: boolean;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}
```

#### 5.2.2 Application Ports (Interfaces)

```typescript
// src/domains/event-management/application/ports/IEventManagementLogger.ts

/**
 * Port dla loggera - implementacja w Infrastructure
 */
export interface IEventManagementLogger {
  logEventSaved(eventId: string, userId: string): Promise<void>;
  logEventRated(eventId: string, userId: string): Promise<void>;
  logEventEdited(eventId: string, userId: string): Promise<void>;
  logEventDeleted(eventId: string, userId: string): Promise<void>;
}
```

### 5.3 Warstwa Infrastruktury (Infrastructure Layer)

#### 5.3.1 Repository Implementation (Adapter)

```typescript
// src/domains/event-management/infrastructure/persistence/SupabaseEventRepository.ts

import { IEventRepository, EventFilters } from "../../domain/repositories/IEventRepository";
import { Event } from "../../domain/entities/Event";
import { EventId } from "../../domain/value-objects/EventId";
import { UserId } from "../../../shared/domain/value-objects/UserId";
import { SupabaseClient } from "../../../../db/supabase.client";
import { EventMapper } from "../mappers/EventMapper";

/**
 * Adapter implementujący IEventRepository dla Supabase
 * Infrastructure concern - szczegóły persistencji
 */
export class SupabaseEventRepository implements IEventRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: EventId): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from("events")
      .select("*")
      .eq("id", id.getValue())
      .single();

    if (error || !data) {
      return null;
    }

    return EventMapper.toDomain(data);
  }

  async findSavedByUser(userId: UserId, filters?: EventFilters): Promise<Event[]> {
    let query = this.supabase
      .from("events")
      .select("*")
      .eq("user_id", userId.getValue())
      .eq("saved", true);

    // Apply filters
    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.ageCategory) {
      query = query.eq("age_category", filters.ageCategory);
    }

    // Apply sorting
    const sortBy = filters?.sortBy || "created_at";
    const sortOrder = filters?.sortOrder || "desc";
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data.map((row) => EventMapper.toDomain(row));
  }

  async save(event: Event): Promise<void> {
    const persistenceModel = EventMapper.toPersistence(event);

    const { error } = await this.supabase.from("events").insert(persistenceModel);

    if (error) {
      throw new InfrastructureError("Failed to save event", error);
    }
  }

  async update(event: Event): Promise<void> {
    const persistenceModel = EventMapper.toPersistence(event);

    const { error } = await this.supabase
      .from("events")
      .update(persistenceModel)
      .eq("id", event.getId().getValue());

    if (error) {
      throw new InfrastructureError("Failed to update event", error);
    }
  }

  async delete(id: EventId): Promise<void> {
    const { error } = await this.supabase
      .from("events")
      .update({ saved: false })
      .eq("id", id.getValue());

    if (error) {
      throw new InfrastructureError("Failed to delete event", error);
    }
  }

  async existsByIdAndUserId(id: EventId, userId: UserId): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("events")
      .select("id")
      .eq("id", id.getValue())
      .eq("user_id", userId.getValue())
      .single();

    return !error && !!data;
  }
}

export class InfrastructureError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "InfrastructureError";
  }
}
```

#### 5.3.2 Mappers (Domain ↔ Persistence)

```typescript
// src/domains/event-management/infrastructure/mappers/EventMapper.ts

import { Event } from "../../domain/entities/Event";
import { EventId } from "../../domain/value-objects/EventId";
import { Description } from "../../domain/value-objects/Description";
import { EventDate } from "../../domain/value-objects/EventDate";
import { UserId } from "../../../shared/domain/value-objects/UserId";
import { EventCategory, AgeCategory } from "../../../shared/domain/value-objects/Categories";
import { Feedback } from "../../domain/value-objects/Feedback";

/**
 * Mapper: Domain Model ↔ Persistence Model
 * Separacja concerns - domain nie wie o strukturze DB
 */
export class EventMapper {
  /**
   * Persistence Model → Domain Model
   */
  static toDomain(raw: EventPersistenceModel): Event {
    return Event.reconstitute({
      id: EventId.create(raw.id),
      ownerId: raw.user_id ? UserId.create(raw.user_id) : null,
      createdByAuthenticatedUser: raw.created_by_authenticated_user,
      title: raw.title,
      city: raw.city,
      eventDate: EventDate.create(raw.event_date),
      category: EventCategory.create(raw.category),
      ageCategory: AgeCategory.create(raw.age_category),
      keyInformation: raw.key_information,
      generatedDescription: Description.create(raw.generated_description),
      editedDescription: raw.edited_description
        ? Description.create(raw.edited_description)
        : null,
      saved: raw.saved,
      feedback: raw.feedback ? Feedback.create(raw.feedback) : null,
      modelVersion: raw.model_version,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
    });
  }

  /**
   * Domain Model → Persistence Model
   */
  static toPersistence(event: Event): EventPersistenceModel {
    return {
      id: event.getId().getValue(),
      user_id: event.getOwnerId()?.getValue() || null,
      created_by_authenticated_user: event.isCreatedByAuthenticatedUser(),
      title: event.getTitle(),
      city: event.getCity(),
      event_date: event.getEventDate().toISOString(),
      category: event.getCategory().getValue(),
      age_category: event.getAgeCategory().getValue(),
      key_information: event.getKeyInformation(),
      generated_description: event.getGeneratedDescription().getValue(),
      edited_description: event.getEditedDescription()?.getValue() || null,
      saved: event.isSaved(),
      feedback: event.getFeedback()?.getValue() || null,
      model_version: event.getModelVersion(),
      created_at: event.getCreatedAt().toISOString(),
      updated_at: event.getUpdatedAt().toISOString(),
    };
  }
}

/**
 * Persistence Model - reprezentacja tabeli w DB
 */
interface EventPersistenceModel {
  id: string;
  user_id: string | null;
  created_by_authenticated_user: boolean;
  title: string;
  city: string;
  event_date: string;
  category: string;
  age_category: string;
  key_information: string;
  generated_description: string;
  edited_description: string | null;
  saved: boolean;
  feedback: string | null;
  model_version: string;
  created_at: string;
  updated_at: string;
}
```

#### 5.3.3 Logger Implementation

```typescript
// src/domains/event-management/infrastructure/logging/SupabaseEventManagementLogger.ts

import { IEventManagementLogger } from "../../application/ports/IEventManagementLogger";
import { SupabaseClient } from "../../../../db/supabase.client";

export class SupabaseEventManagementLogger implements IEventManagementLogger {
  constructor(private readonly supabase: SupabaseClient) {}

  async logEventSaved(eventId: string, userId: string): Promise<void> {
    await this.log("event_saved", eventId, userId);
  }

  async logEventRated(eventId: string, userId: string): Promise<void> {
    await this.log("event_rated", eventId, userId);
  }

  async logEventEdited(eventId: string, userId: string): Promise<void> {
    await this.log("event_edited", eventId, userId);
  }

  async logEventDeleted(eventId: string, userId: string): Promise<void> {
    await this.log("event_deleted", eventId, userId);
  }

  private async log(actionType: string, eventId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.from("event_management_logs").insert({
      action_type: actionType,
      event_id: eventId,
      user_id: userId,
    });

    if (error) {
      // Log error but don't fail the operation
      console.error("Failed to log event management action:", error);
    }
  }
}
```

### 5.4 Warstwa Interfejsu (Interface Layer)

#### 5.4.1 API Endpoint (Adapter)

```typescript
// src/domains/event-management/interface/api/events/save.ts (jako przykład w Astro)

import type { APIRoute } from "astro";
import { SaveEventUseCase } from "../../../application/use-cases/SaveEventUseCase";
import { SupabaseEventRepository } from "../../../infrastructure/persistence/SupabaseEventRepository";
import { SupabaseEventManagementLogger } from "../../../infrastructure/logging/SupabaseEventManagementLogger";
import { DomainEventPublisher } from "../../../../shared/application/events/DomainEventPublisher";

export const prerender = false;

/**
 * PATCH /api/events/[id]/save
 * Zapisuje wydarzenie jako ulubione
 */
export const PATCH: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Autentykacja (Infrastructure concern)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        { status: 401 }
      );
    }

    // 2. Dependency Injection - ręczne (można użyć DI Container)
    const eventRepository = new SupabaseEventRepository(supabase);
    const logger = new SupabaseEventManagementLogger(supabase);
    const eventPublisher = new DomainEventPublisher();

    const useCase = new SaveEventUseCase(eventRepository, logger, eventPublisher);

    // 3. Wykonanie Use Case
    const result = await useCase.execute({
      eventId: params.id!,
      userId: user.id,
    });

    // 4. Zwracamy odpowiedź
    return new Response(
      JSON.stringify({
        success: true,
        eventId: result.eventId,
        message: "Event saved successfully",
      }),
      { status: 200 }
    );
  } catch (error) {
    // 5. Error handling
    if (error instanceof ApplicationError) {
      return new Response(
        JSON.stringify({
          error: error.name,
          message: error.message,
        }),
        { status: error.statusCode }
      );
    }

    // Unexpected errors
    console.error("Unexpected error in save event endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "InternalServerError",
        message: "An unexpected error occurred",
      }),
      { status: 500 }
    );
  }
};
```

### 5.5 Nowa Struktura Katalogów

```
src/
├── domains/
│   ├── event-management/                    # Bounded Context
│   │   ├── domain/                          # Domain Layer
│   │   │   ├── entities/
│   │   │   │   └── Event.ts                 # Aggregate Root
│   │   │   ├── value-objects/
│   │   │   │   ├── EventId.ts
│   │   │   │   ├── Description.ts
│   │   │   │   ├── EventDate.ts
│   │   │   │   └── Feedback.ts
│   │   │   ├── events/                      # Domain Events
│   │   │   │   ├── EventSavedDomainEvent.ts
│   │   │   │   ├── EventRatedDomainEvent.ts
│   │   │   │   └── EventEditedDomainEvent.ts
│   │   │   ├── repositories/                # Repository Interfaces (Ports)
│   │   │   │   └── IEventRepository.ts
│   │   │   └── errors/
│   │   │       └── DomainError.ts
│   │   ├── application/                     # Application Layer
│   │   │   ├── use-cases/
│   │   │   │   ├── SaveEventUseCase.ts
│   │   │   │   ├── RateEventUseCase.ts
│   │   │   │   ├── EditEventDescriptionUseCase.ts
│   │   │   │   ├── GetUserEventsUseCase.ts
│   │   │   │   └── DeleteEventUseCase.ts
│   │   │   ├── ports/                       # Application Ports
│   │   │   │   └── IEventManagementLogger.ts
│   │   │   └── errors/
│   │   │       └── ApplicationError.ts
│   │   ├── infrastructure/                  # Infrastructure Layer
│   │   │   ├── persistence/
│   │   │   │   └── SupabaseEventRepository.ts  # Repository Implementation
│   │   │   ├── mappers/
│   │   │   │   └── EventMapper.ts
│   │   │   └── logging/
│   │   │       └── SupabaseEventManagementLogger.ts
│   │   └── interface/                       # Interface Layer
│   │       ├── api/                         # REST API Adapters
│   │       │   └── events/
│   │       │       ├── save.ts
│   │       │       ├── rate.ts
│   │       │       ├── edit.ts
│   │       │       └── list.ts
│   │       └── dto/                         # Data Transfer Objects
│   │           └── EventDTO.ts
│   │
│   ├── event-generation/                    # Bounded Context
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── EventDraft.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── Prompt.ts
│   │   │   │   └── ModelVersion.ts
│   │   │   └── services/                    # Domain Services
│   │   │       └── IEventDescriptionGenerator.ts
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │       └── GenerateEventDescriptionUseCase.ts
│   │   ├── infrastructure/
│   │   │   └── ai/
│   │   │       └── OpenRouterDescriptionGenerator.ts
│   │   └── interface/
│   │       └── api/
│   │
│   ├── event-feedback/                      # Bounded Context
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── Rating.ts
│   │   │   └── value-objects/
│   │   │       └── FeedbackScore.ts
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │       └── CollectFeedbackUseCase.ts
│   │   └── infrastructure/
│   │
│   ├── identity-access/                     # Bounded Context
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── User.ts
│   │   │   └── value-objects/
│   │   │       └── Email.ts
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │       ├── AuthenticateUserUseCase.ts
│   │   │       └── LogUserActivityUseCase.ts
│   │   └── infrastructure/
│   │       └── auth/
│   │           └── SupabaseAuthService.ts
│   │
│   └── shared/                              # Shared Kernel
│       ├── domain/
│       │   ├── value-objects/
│       │   │   ├── UserId.ts
│       │   │   ├── EventCategory.ts
│       │   │   └── AgeCategory.ts
│       │   └── events/
│       │       └── DomainEvent.ts
│       └── application/
│           └── events/
│               └── DomainEventPublisher.ts
│
├── components/                              # UI Layer (pozostaje bez zmian)
├── pages/                                   # Astro Pages (routes)
└── middleware/                              # Middleware (cross-cutting)
```

## 6. Wzorce Strategiczne Zastosowane

### 6.1 Bounded Context

✅ **Zastosowanie:** Wydzielenie 4 głównych kontekstów:
- Event Generation
- Event Management
- Event Feedback
- Identity & Access

**Korzyści:**
- Jasne granice odpowiedzialności
- Możliwość niezależnego rozwoju
- Łatwiejsze testowanie

### 6.2 Context Mapping

✅ **Zastosowanie:** Zdefiniowanie relacji między kontekstami:
- **Published Language**: Event Generation → Event Management
- **Customer/Supplier**: Event Management → Event Feedback
- **Conformist**: Wszystkie → Identity (Supabase)
- **Shared Kernel**: Wspólne Value Objects

**Korzyści:**
- Jasne zależności
- Kontrolowane przepływy danych
- Anti-Corruption Layer gdzie potrzeba

### 6.3 Ubiquitous Language

✅ **Zastosowanie:** Konsekwentna terminologia domenowa w kodzie:
- `Event` zamiast `EventResponseDTO`
- `EventDraft` zamiast `CreateEventDTO`
- `save()` zamiast `updateEventSavedStatus()`

**Korzyści:**
- Kod jest zrozumiały dla biznesu
- Łatwiejsza komunikacja w zespole
- Mniej nieporozumień

## 7. Wzorce Taktyczne Zastosowane

### 7.1 Entity & Aggregate Root

✅ **Zastosowanie:** `Event` jako Aggregate Root
- Enkapsuluje reguły biznesowe
- Kontroluje dostęp do składowych
- Publikuje Domain Events

### 7.2 Value Objects

✅ **Zastosowanie:**
- `EventId`, `Description`, `EventDate`
- Immutable
- Self-validating
- Semantyczne metody biznesowe

### 7.3 Repository Pattern

✅ **Zastosowanie:** `IEventRepository` (Port) + `SupabaseEventRepository` (Adapter)
- Abstrakcja dostępu do danych
- Domain nie wie o Supabase
- Łatwa zmiana implementacji

### 7.4 Domain Events

✅ **Zastosowanie:**
- `EventSavedDomainEvent`, `EventRatedDomainEvent`
- Loose coupling między agregatami
- Integration events dla zewnętrznych systemów

### 7.5 Application Services (Use Cases)

✅ **Zastosowanie:**
- Orchestracja operacji domenowych
- Transaction boundaries
- Cross-cutting concerns (logging, auth)

### 7.6 Hexagonal Architecture (Ports & Adapters)

✅ **Zastosowanie:**
- Domain w centrum (niezależne od frameworków)
- Ports: Interfaces (`IEventRepository`, `IEventManagementLogger`)
- Adapters: Implementations (`SupabaseEventRepository`, API Endpoints)

### 7.7 CQRS (Command Query Responsibility Segregation)

✅ **Zastosowanie (lite):**
- Command Use Cases: `SaveEventUseCase`, `RateEventUseCase`
- Query Use Cases: `GetUserEventsUseCase`
- Różne optymalizacje dla read vs write

## 8. Plan Migracji

### Faza 1: Przygotowanie (1-2 tygodnie)

1. **Utworzenie struktury katalogów**
   - Stworzenie `src/domains/` z podstawową strukturą
   - Dodanie Shared Kernel

2. **Implementacja Value Objects**
   - Wydzielenie `EventId`, `UserId`, `Description`, `EventDate`
   - Testy jednostkowe dla Value Objects

3. **Definicja Repository Interfaces**
   - Port `IEventRepository`
   - Port `IEventManagementLogger`

### Faza 2: Migracja Event Management (2-3 tygodnie)

1. **Domain Layer**
   - Implementacja `Event` Aggregate
   - Domain Events
   - Reguły biznesowe

2. **Application Layer**
   - Use Cases: Save, Rate, Edit, Delete
   - Testy Use Cases

3. **Infrastructure Layer**
   - `SupabaseEventRepository`
   - `EventMapper`
   - Testy integracyjne

4. **Interface Layer**
   - Refaktoryzacja API endpoints
   - Dependency Injection

### Faza 3: Pozostałe Konteksty (3-4 tygodnie)

1. **Event Generation Context**
   - Wydzielenie logiki AI
   - `GenerateEventDescriptionUseCase`

2. **Event Feedback Context**
   - Analityka i metryki
   - Feedback aggregation

3. **Identity & Access Context**
   - Wrapper nad Supabase Auth
   - Activity logging

### Faza 4: Finalizacja (1 tydzień)

1. **Usunięcie starego kodu**
   - `src/lib/services/` (zastąpione Use Cases)
   - Stare DTOs (zastąpione Domain Models)

2. **Aktualizacja dokumentacji**
3. **Code review i testy e2e**

## 9. Korzyści po Refaktoryzacji

### 9.1 Utrzymywalność

✅ **Przed:** Logika rozproszona w serwisach, trudno znaleźć reguły biznesowe
✅ **Po:** Reguły biznesowe w agregatach, jasna struktura domenowa

### 9.2 Testowalność

✅ **Przed:** Testy wymagają Supabase, trudne mockowanie
✅ **Po:** Domain Layer testowany w izolacji, Use Cases z mockami

### 9.3 Skalowalność

✅ **Przed:** Monolityczny serwis, trudno rozdzielić odpowiedzialności
✅ **Po:** Bounded Contexts mogą ewoluować niezależnie

### 9.4 Czytelność

✅ **Przed:** `updateEvent()` robi wszystko, trudno zrozumieć intencję
✅ **Po:** `event.save()`, `event.rate()` - jasna intencja biznesowa

### 9.5 Niezależność od Frameworków

✅ **Przed:** Silne powiązanie z Supabase i Astro
✅ **Po:** Domain Core niezależne, łatwa migracja infrastruktury

## 10. Rekomendacje

### 10.1 Krytyczne

1. **Rozpocznij od jednego kontekstu** (Event Management)
2. **Pisz testy na każdym kroku** (Domain → Application → Infrastructure)
3. **Stopniowa migracja** (nie przepisuj wszystkiego naraz)
4. **Pair programming** przy pierwszych agregatach (nauka wzorców)

### 10.2 Ważne

5. **Dokumentuj Ubiquitous Language** (glossary terminów domenowych)
6. **Code reviews** z fokusem na Domain Logic
7. **Użyj DI Container** (np. tsyringe) dla Use Cases
8. **Event Sourcing?** - na przyszłość, jeśli potrzeba auditu

### 10.3 Nice to have

9. **CQRS z oddzielnymi modelami read/write**
10. **Event-Driven Architecture** z message busem
11. **Sagas** dla długotrwałych procesów
12. **Domain Modeling Workshop** z ekspertami biznesowymi

## 11. Podsumowanie

Refaktoryzacja w kierunku DDD pozwoli na:
- ✅ Wyraźne granice odpowiedzialności (Bounded Contexts)
- ✅ Enkapsulację logiki biznesowej (Aggregates, Value Objects)
- ✅ Niezależność od infrastruktury (Hexagonal Architecture)
- ✅ Łatwiejsze testowanie (Domain w izolacji)
- ✅ Lepszą komunikację z biznesem (Ubiquitous Language)
- ✅ Skalowalność i możliwość ewolucji

**Kluczowe przesłanie:** DDD to przede wszystkim sposób myślenia o domenie biznesowej, a dopiero potem wzorce techniczne. Rozpocznij od głębokiego zrozumienia domeny, a następnie stopniowo wprowadzaj wzorce tam, gdzie przynoszą wartość.

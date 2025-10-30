import { EventForm } from "./EventForm";
import { DescriptionPanel } from "./DescriptionPanel";
import { AuthPromptBanner } from "./AuthPromptBanner";
import { TimeoutNotice } from "./TimeoutNotice";
import type { UseGeneratorReturn } from "../hooks/useGenerator";

interface GeneratorPageViewProps {
  generator: UseGeneratorReturn;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
}

/**
 * Presentation component for GeneratorPage
 */
export function GeneratorPageView({ generator, isAuthenticated, isLoadingAuth }: GeneratorPageViewProps) {
  // Loading state
  if (isLoadingAuth || generator.isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (generator.hasDataError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Wystąpił błąd podczas ładowania danych.</p>
          <button
            onClick={generator.reloadData}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Odśwież stronę
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <AuthPromptBanner visible={!isAuthenticated && !!generator.generatedEvent} />
        <TimeoutNotice visible={generator.status.timeoutElapsed} onRetry={generator.handleGenerate} />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Form */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Dane wydarzenia</h2>
            <EventForm
              values={generator.values}
              errors={generator.errors}
              onChange={generator.updateField}
              onSubmit={generator.handleGenerate}
              disabled={generator.status.isGenerating}
              categories={generator.categories}
              ageCategories={generator.ageCategories}
            />
          </div>

          {/* Right Column: Preview */}
          <div>
            <DescriptionPanel
              generated={generator.generatedEvent}
              isGenerating={generator.status.isGenerating}
              isSaving={generator.status.isSaving}
              isCopying={generator.status.isCopying}
              isAuthenticated={isAuthenticated}
              onGenerate={generator.handleGenerate}
              onSave={generator.handleSave}
              onCopy={generator.handleCopy}
              onRate={generator.handleRate}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

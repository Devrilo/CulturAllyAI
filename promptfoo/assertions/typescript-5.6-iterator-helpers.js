/**
 * Asercja sprawdzająca czy kod używa TypeScript 5.6 Iterator Helpers
 * Weryfikuje użycie .map(), .filter(), .take() bezpośrednio na iteratorach
 */

export default async (output, _context) => {
  const code = output.trim();

  if (!code) {
    return {
      pass: false,
      score: 0,
      reason: "Generated code is empty",
    };
  }

  // Sprawdź czy używa iterator helpers (.map, .filter, .take)
  const usesIteratorMap = /\.\s*map\s*\(/.test(code);
  const usesIteratorFilter = /\.\s*filter\s*\(/.test(code);
  const usesIteratorTake = /\.\s*take\s*\(/.test(code);

  const iteratorHelpersCount = [usesIteratorMap, usesIteratorFilter, usesIteratorTake].filter(Boolean).length;

  if (iteratorHelpersCount === 0) {
    return {
      pass: false,
      score: 0.2,
      reason: "Missing Iterator Helpers (.map, .filter, .take) - model does not know TypeScript 5.6 API",
    };
  }

  if (iteratorHelpersCount < 2) {
    return {
      pass: false,
      score: 0.4,
      reason: `Only ${iteratorHelpersCount} Iterator Helper method used, expected at least 2`,
    };
  }

  // Sprawdź czy NIE konwertuje do array (stare podejście)
  if (code.includes("Array.from")) {
    return {
      pass: false,
      score: 0.3,
      reason: "Uses Array.from() - old approach, should use Iterator Helpers directly",
    };
  }

  // Sprawdź czy NIE używa spread operator do konwersji
  if (/\[\s*\.\.\.\s*\w+\s*\]/.test(code)) {
    return {
      pass: false,
      score: 0.3,
      reason: "Uses spread operator [...iterator] - old approach, should use Iterator Helpers",
    };
  }

  // Sprawdź czy ma definicję funkcji
  const hasFunction = /function\s+\w+/.test(code) || /const\s+\w+\s*=\s*(\([^)]*\)|[^=]+)\s*=>/.test(code);
  if (!hasFunction) {
    return {
      pass: false,
      score: 0.4,
      reason: "Missing function definition",
    };
  }

  // Sprawdź czy ma typy TypeScript
  const hasTypes = /:\s*Iterator</.test(code) || /:\s*IterableIterator</.test(code) || /Generator</.test(code);
  if (!hasTypes) {
    return {
      pass: false,
      score: 0.7,
      reason: "Missing TypeScript iterator type annotations (Iterator<T>, IterableIterator<T>)",
    };
  }

  return {
    pass: true,
    score: 1.0,
    reason: `Correctly uses TypeScript 5.6 Iterator Helpers (${iteratorHelpersCount} methods) with proper types`,
  };
};

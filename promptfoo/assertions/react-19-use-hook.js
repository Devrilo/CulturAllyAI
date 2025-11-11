/**
 * Asercja sprawdzająca czy kod używa React 19 hook use()
 * Weryfikuje poprawność składni TypeScript i obecność use() hook
 */

export default async (output, _context) => {
  const code = output.trim();

  // Sprawdź czy kod nie jest pusty
  if (!code) {
    return {
      pass: false,
      score: 0,
      reason: "Generated code is empty",
    };
  }

  // Sprawdź czy zawiera import use z react
  const hasUseImport = /import\s+{[^}]*\buse\b[^}]*}\s+from\s+['"]react['"]/.test(code);
  if (!hasUseImport) {
    return {
      pass: false,
      score: 0.3,
      reason: 'Missing import { use } from "react" - model does not know React 19 API',
    };
  }

  // Sprawdź czy używa use() hook
  const usesUseHook = /\buse\s*\([^)]*Promise[^)]*\)/.test(code) || /\buse\s*\(\s*\w+Promise\s*\)/.test(code);
  if (!usesUseHook) {
    return {
      pass: false,
      score: 0.5,
      reason: "use() hook is imported but not used correctly with Promise",
    };
  }

  // Sprawdź czy NIE używa starego podejścia z useEffect
  if (code.includes("useEffect")) {
    return {
      pass: false,
      score: 0.4,
      reason: "Code uses old useEffect approach instead of new use() hook",
    };
  }

  // Sprawdź czy ma typy TypeScript
  const hasTypes = /:\s*Promise</.test(code) || /interface\s+\w+/.test(code) || /type\s+\w+/.test(code);
  if (!hasTypes) {
    return {
      pass: false,
      score: 0.7,
      reason: "Missing TypeScript type annotations",
    };
  }

  return {
    pass: true,
    score: 1.0,
    reason: "Correctly uses React 19 use() hook with proper TypeScript types",
  };
};

/**
 * Asercja sprawdzająca czy kod używa Astro 5 ClientRouter
 * Weryfikuje użycie nowego API zamiast starego ViewTransitions
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

  // Sprawdź czy importuje z astro:transitions
  const hasTransitionsImport =
    /import\s+{[^}]*ClientRouter[^}]*}\s+from\s+['"]astro:transitions['"]/.test(code) ||
    /import\s+{[^}]*}\s+from\s+['"]astro:transitions['"]/.test(code);
  if (!hasTransitionsImport) {
    return {
      pass: false,
      score: 0.2,
      reason: 'Missing import from "astro:transitions" - model does not know Astro 5 API',
    };
  }

  // Sprawdź czy używa <ClientRouter />
  const usesClientRouter = /<ClientRouter\s*\/?>/.test(code);
  if (!usesClientRouter) {
    return {
      pass: false,
      score: 0.4,
      reason: "Missing <ClientRouter /> component - this is the new Astro 5 approach",
    };
  }

  // Sprawdź czy NIE używa starego <ViewTransitions />
  if (/<ViewTransitions\s*\/?>/.test(code)) {
    return {
      pass: false,
      score: 0.3,
      reason: "Code uses old <ViewTransitions /> API instead of new <ClientRouter />",
    };
  }

  // Sprawdź czy używa transition:animate
  const hasTransitionDirective = /transition:animate/.test(code);
  if (!hasTransitionDirective) {
    return {
      pass: false,
      score: 0.6,
      reason: "Missing transition:animate directive on elements",
    };
  }

  // Sprawdź czy ma strukturę Astro layout
  const hasAstroStructure = /---[\s\S]*---/.test(code);
  if (!hasAstroStructure) {
    return {
      pass: false,
      score: 0.5,
      reason: "Missing Astro frontmatter section (--- ... ---)",
    };
  }

  return {
    pass: true,
    score: 1.0,
    reason: "Correctly uses Astro 5 ClientRouter with transition:animate",
  };
};

import { useCallback, useMemo, useEffect, useState } from "react";

/**
 * Hook to manage redirectTo parameter in auth flows
 * Extracts redirect URL from query params and provides navigation utilities
 */
export function useAuthRedirect() {
  const [shouldNavigate, setShouldNavigate] = useState<string | null>(null);

  // Extract redirect parameter from URL
  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return "/";

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    // Validate redirect to prevent open redirect vulnerabilities
    // Only allow relative paths starting with /
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      return redirect;
    }

    return "/";
  }, []);

  // Effect to handle navigation
  useEffect(() => {
    if (shouldNavigate && typeof window !== "undefined") {
      window.location.href = shouldNavigate;
    }
  }, [shouldNavigate]);

  /**
   * Navigate to the redirect URL or fallback
   */
  const navigateToRedirect = useCallback(
    (fallback = "/") => {
      setShouldNavigate(redirectTo || fallback);
    },
    [redirectTo]
  );

  /**
   * Build login URL with current page as redirect target
   */
  const buildLoginUrl = useCallback((currentPath?: string) => {
    const path = currentPath || (typeof window !== "undefined" ? window.location.pathname : "");
    if (path && path !== "/" && path !== "/login" && path !== "/register") {
      return `/login?redirect=${encodeURIComponent(path)}`;
    }
    return "/login";
  }, []);

  /**
   * Build register URL with current page as redirect target
   */
  const buildRegisterUrl = useCallback((currentPath?: string) => {
    const path = currentPath || (typeof window !== "undefined" ? window.location.pathname : "");
    if (path && path !== "/" && path !== "/login" && path !== "/register") {
      return `/register?redirect=${encodeURIComponent(path)}`;
    }
    return "/register";
  }, []);

  return {
    redirectTo,
    navigateToRedirect,
    buildLoginUrl,
    buildRegisterUrl,
  };
}

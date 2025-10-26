import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "./sonner";

/**
 * Global toast manager component
 * Handles URL parameter-based notifications
 */
export function ToastManager() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");

    if (message) {
      // Clean up URL first
      window.history.replaceState({}, "", window.location.pathname);

      // Show appropriate toast based on message type
      switch (message) {
        case "already_logged_in":
          toast.info("Jesteś już zalogowany");
          break;
        case "password_changed":
          toast.success("Hasło zostało zmienione pomyślnie");
          break;
        case "account_deleted":
          toast.success("Konto zostało usunięte");
          break;
        case "logged_out":
          toast.info("Zostałeś wylogowany");
          break;
        default:
          break;
      }
    }
  }, []);

  return <Toaster position="bottom-right" />;
}

import { useContext } from "react";

import { CookieConsentContext } from "./CookieConsentProvider";

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }

  return context;
}

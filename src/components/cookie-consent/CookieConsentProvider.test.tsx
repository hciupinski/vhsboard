import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { COOKIE_CONSENT_NAME, getCookiePreferences } from "@/lib/cookie-consent";

import { CookieConsentProvider } from "./CookieConsentProvider";
import { useCookieConsent } from "./useCookieConsent";

function CookieSettingsTrigger() {
  const { openPreferences } = useCookieConsent();

  return <button onClick={openPreferences}>Ustawienia cookies</button>;
}

const clearCookiePreferences = () => {
  document.cookie = `${COOKIE_CONSENT_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
};

afterEach(() => {
  cleanup();
  clearCookiePreferences();
});

describe("CookieConsentProvider", () => {
  it("stores disabled optional categories when the visitor rejects all", async () => {
    const user = userEvent.setup();
    render(
      <CookieConsentProvider>
        <p>Treść strony</p>
      </CookieConsentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Odrzuć wszystkie" }));

    expect(
      screen.queryByRole("heading", { name: "Szanujemy Twoją prywatność" }),
    ).not.toBeInTheDocument();
    expect(getCookiePreferences()).toEqual({ analytics: false, marketing: false });
  });

  it("saves granular choices selected in preferences", async () => {
    const user = userEvent.setup();
    render(
      <CookieConsentProvider>
        <p>Treść strony</p>
      </CookieConsentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Dostosuj" }));
    await user.click(screen.getByRole("switch", { name: "Analityczne" }));
    await user.click(screen.getByRole("button", { name: "Zapisz ustawienia" }));

    expect(getCookiePreferences()).toEqual({ analytics: true, marketing: false });
  });

  it("reopens preferences after a saved choice", async () => {
    const user = userEvent.setup();
    render(
      <CookieConsentProvider>
        <CookieSettingsTrigger />
      </CookieConsentProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Odrzuć wszystkie" }));
    await user.click(screen.getByRole("button", { name: "Ustawienia cookies" }));

    expect(await screen.findByRole("dialog", { name: "Ustawienia cookies" })).toBeInTheDocument();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicSiteConfig } from "./site-config";

const publicSiteEnv = {
  VITE_CONTACT_EMAIL: "kontakt@example.test",
  VITE_CONTACT_PHONE: "+48123456789",
  VITE_BUSINESS_NAME: "Testowa firma",
  VITE_BUSINESS_STREET: "ul. Przykładowa 1",
  VITE_BUSINESS_POSTAL_CODE: "00-001",
  VITE_BUSINESS_CITY: "Warszawa",
  VITE_BUSINESS_NIP: "1234567890",
  VITE_BUSINESS_REGON: "123456789",
  VITE_BUSINESS_BANK_ACCOUNT: "12345678901234567890123456",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public site configuration", () => {
  it("reads the required contact and business details from public environment variables", () => {
    for (const [name, value] of Object.entries(publicSiteEnv)) {
      vi.stubEnv(name, value);
    }

    expect(getPublicSiteConfig()).toEqual({
      contactEmail: "kontakt@example.test",
      contactPhone: "+48123456789",
      businessName: "Testowa firma",
      businessStreet: "ul. Przykładowa 1",
      businessPostalCode: "00-001",
      businessCity: "Warszawa",
      businessNip: "1234567890",
      businessRegon: "123456789",
      businessBankAccount: "12345678901234567890123456",
    });
  });

  it("fails clearly when a required public value is missing", () => {
    for (const [name, value] of Object.entries(publicSiteEnv)) {
      vi.stubEnv(name, value);
    }
    vi.stubEnv("VITE_CONTACT_EMAIL", "");

    expect(getPublicSiteConfig).toThrow(
      "Brak wymaganej zmiennej środowiskowej: VITE_CONTACT_EMAIL.",
    );
  });

  it("rejects contact data that cannot be used in a link", () => {
    for (const [name, value] of Object.entries(publicSiteEnv)) {
      vi.stubEnv(name, value);
    }
    vi.stubEnv("VITE_CONTACT_EMAIL", "niepoprawny-adres");

    expect(getPublicSiteConfig).toThrow("VITE_CONTACT_EMAIL musi być poprawnym adresem e-mail.");
  });
});

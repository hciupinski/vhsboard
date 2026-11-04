import { describe, expect, it } from "vitest";

import {
  resolveDeploymentTarget,
  validateDeploymentEnvironment,
  validatePagesProject,
} from "./deployment-config";

const productionRef = "jiqgcbqsbmzokcmtjtsw";
const developmentRef = "hrtxiivubihmxsjuxzer";
const production = { branch: "main", environment: "production" } as const;
const development = { branch: "develop", environment: "development" } as const;
const fixture = (dev = true): Record<string, string | undefined> => ({
  CLOUDFLARE_PAGES_PROJECT: "vhsboard",
  SUPABASE_PRODUCTION_PROJECT_REF: productionRef,
  SUPABASE_DEVELOPMENT_PROJECT_REF: developmentRef,
  SUPABASE_PROJECT_ID: dev ? developmentRef : productionRef,
  SUPABASE_DB_PASSWORD: "private-database-password",
  SUPABASE_ACCESS_TOKEN: "private-supabase-token",
  CLOUDFLARE_API_TOKEN: "private-cloudflare-token",
  CLOUDFLARE_ACCOUNT_ID: "account-id",
  VITE_SUPABASE_URL: `https://${dev ? developmentRef : productionRef}.supabase.co`,
  VITE_SUPABASE_ANON_KEY: "public-anon-key",
  VITE_SITE_URL: dev ? "https://develop.vhsboard.pages.dev" : "https://vhsboard.pages.dev",
  VITE_SEO_INDEXING: "false",
  VITE_CONTACT_EMAIL: "kontakt@example.test",
  VITE_CONTACT_PHONE: "+48123456789",
  VITE_BUSINESS_NAME: "Testowa firma",
  VITE_BUSINESS_STREET: "ul. Przykładowa 1",
  VITE_BUSINESS_POSTAL_CODE: "00-001",
  VITE_BUSINESS_CITY: "Warszawa",
  VITE_BUSINESS_NIP: "1234567890",
  VITE_BUSINESS_REGON: "123456789",
  VITE_BUSINESS_BANK_ACCOUNT: "12345678901234567890123456",
});

describe("resolveDeploymentTarget", () => {
  it.each([
    ["refs/heads/main", production],
    ["refs/heads/develop", development],
  ])("maps only the complete branch ref %s", (ref, target) => {
    expect(resolveDeploymentTarget(ref)).toEqual(target);
  });

  it.each(["", "main", "refs/tags/main", "refs/heads/feature/x", "refs/remotes/origin/develop"])(
    "rejects unsupported ref %s",
    (ref) => expect(() => resolveDeploymentTarget(ref)).toThrow(),
  );
});

describe("validateDeploymentEnvironment", () => {
  it("accepts isolated development", () => {
    expect(() => validateDeploymentEnvironment(development, fixture())).not.toThrow();
  });

  it("accepts the current production Pages configuration", () => {
    expect(() => validateDeploymentEnvironment(production, fixture(false))).not.toThrow();
  });

  it.each(["false", "true"])("allows production domain with indexing=%s", (indexing) => {
    expect(() =>
      validateDeploymentEnvironment(production, {
        ...fixture(false),
        VITE_SITE_URL: "https://vhsboard.pl",
        VITE_SEO_INDEXING: indexing,
      }),
    ).not.toThrow();
  });

  for (const name of Object.keys(fixture())) {
    it.each([undefined, "", "   "])(`rejects missing ${name}: %s`, (value) => {
      expect(() =>
        validateDeploymentEnvironment(development, { ...fixture(), [name]: value }),
      ).toThrow(name);
    });
  }

  it.each([
    { SUPABASE_PRODUCTION_PROJECT_REF: developmentRef },
    { SUPABASE_DEVELOPMENT_PROJECT_REF: "invalid/ref" },
    { SUPABASE_PROJECT_ID: productionRef },
    { VITE_SUPABASE_URL: `https://${productionRef}.supabase.co` },
    { VITE_SUPABASE_URL: `https://${developmentRef}.supabase.co/extra` },
    { VITE_SUPABASE_URL: `https://${developmentRef}.supabase.co?token=test` },
    { VITE_SUPABASE_URL: `https://${developmentRef}.supabase.co.evil.test` },
    { VITE_SITE_URL: "https://vhsboard.pages.dev" },
    { VITE_SITE_URL: "https://develop.vhsboard.pages.dev/" },
    { VITE_SITE_URL: "https://develop.vhsboard.pages.dev?test=1" },
    { VITE_SEO_INDEXING: "true" },
    { VITE_SEO_INDEXING: "yes" },
    { CLOUDFLARE_PAGES_PROJECT: "another-project" },
  ])("rejects a mismatched development configuration: %j", (override) => {
    expect(() =>
      validateDeploymentEnvironment(development, { ...fixture(), ...override }),
    ).toThrow();
  });

  it("rejects an inconsistent environment and branch", () => {
    expect(() =>
      validateDeploymentEnvironment({ branch: "main", environment: "development" }, fixture()),
    ).toThrow();
  });

  it.each([
    { VITE_SEO_INDEXING: "true" },
    { VITE_SITE_URL: "https://develop.vhsboard.pages.dev" },
    { VITE_SITE_URL: "https://other.test" },
  ])("rejects an invalid production origin/indexing pair: %j", (override) => {
    expect(() =>
      validateDeploymentEnvironment(production, { ...fixture(false), ...override }),
    ).toThrow();
  });

  it("never includes credentials in a validation error", () => {
    const values = fixture();
    const sensitive = [
      values["VITE_SUPABASE_ANON_KEY"]!,
      values["SUPABASE_DB_PASSWORD"]!,
      values["SUPABASE_ACCESS_TOKEN"]!,
      values["CLOUDFLARE_API_TOKEN"]!,
    ];
    for (const value of sensitive) {
      try {
        validateDeploymentEnvironment(development, { ...values, VITE_SUPABASE_URL: value });
        expect.fail("invalid URL should have been rejected");
      } catch (error) {
        for (const secret of sensitive) expect(String(error)).not.toContain(secret);
      }
    }
  });
});

describe("validatePagesProject", () => {
  const project = {
    name: "vhsboard",
    subdomain: "vhsboard.pages.dev",
    production_branch: "main",
  };
  it("accepts the actual Pages production branch main", () => {
    expect(() => validatePagesProject(project)).not.toThrow();
  });

  it.each([
    null,
    {},
    { ...project, production_branch: "develop" },
    { ...project, production_branch: undefined },
    { ...project, name: "other" },
    { ...project, subdomain: "other.pages.dev" },
  ])("blocks an unexpected Pages project: %j", (input) => {
    expect(() => validatePagesProject(input)).toThrow();
  });
});

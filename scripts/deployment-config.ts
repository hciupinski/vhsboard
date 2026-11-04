export type DeploymentTarget = {
  branch: "main" | "develop";
  environment: "production" | "development";
};

export function resolveDeploymentTarget(gitRef: string): DeploymentTarget {
  if (gitRef === "refs/heads/main") return { branch: "main", environment: "production" };
  if (gitRef === "refs/heads/develop") return { branch: "develop", environment: "development" };
  throw new Error("Deployment requires the main or develop branch.");
}

const requiredVariables = [
  "CLOUDFLARE_PAGES_PROJECT",
  "SUPABASE_PRODUCTION_PROJECT_REF",
  "SUPABASE_DEVELOPMENT_PROJECT_REF",
  "SUPABASE_PROJECT_ID",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_ACCESS_TOKEN",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_SITE_URL",
  "VITE_SEO_INDEXING",
  "VITE_CONTACT_EMAIL",
  "VITE_CONTACT_PHONE",
  "VITE_BUSINESS_NAME",
  "VITE_BUSINESS_STREET",
  "VITE_BUSINESS_POSTAL_CODE",
  "VITE_BUSINESS_CITY",
  "VITE_BUSINESS_NIP",
  "VITE_BUSINESS_REGON",
  "VITE_BUSINESS_BANK_ACCOUNT",
] as const;

export function validateDeploymentEnvironment(
  target: DeploymentTarget,
  environment: Record<string, string | undefined>,
): void {
  for (const name of requiredVariables) {
    if (!environment[name]?.trim()) throw new Error(`Missing deployment variable: ${name}.`);
  }
  const expectedTarget = resolveDeploymentTarget(`refs/heads/${target.branch}`);
  if (target.environment !== expectedTarget.environment) {
    throw new Error("Deployment branch and environment do not match.");
  }
  const productionRef = environment["SUPABASE_PRODUCTION_PROJECT_REF"]!;
  const developmentRef = environment["SUPABASE_DEVELOPMENT_PROJECT_REF"]!;
  if (!/^[a-z]{20}$/.test(productionRef) || !/^[a-z]{20}$/.test(developmentRef)) {
    throw new Error("Invalid SUPABASE_PRODUCTION_PROJECT_REF or SUPABASE_DEVELOPMENT_PROJECT_REF.");
  }
  if (productionRef === developmentRef) throw new Error("Supabase project refs must differ.");
  const expectedRef = target.environment === "production" ? productionRef : developmentRef;
  if (environment["SUPABASE_PROJECT_ID"] !== expectedRef) {
    throw new Error("SUPABASE_PROJECT_ID does not match the expected deployment project.");
  }
  if (environment["VITE_SUPABASE_URL"] !== `https://${expectedRef}.supabase.co`) {
    throw new Error("VITE_SUPABASE_URL does not match the expected deployment project.");
  }
  if (environment["CLOUDFLARE_PAGES_PROJECT"] !== "vhsboard") {
    throw new Error("CLOUDFLARE_PAGES_PROJECT must be vhsboard.");
  }
  const { VITE_SITE_URL: siteUrl, VITE_SEO_INDEXING: indexing } = environment;
  const validSeo =
    target.environment === "development"
      ? siteUrl === "https://develop.vhsboard.pages.dev" && indexing === "false"
      : (siteUrl === "https://vhsboard.pages.dev" && indexing === "false") ||
        (siteUrl === "https://vhsboard.pl" && (indexing === "false" || indexing === "true"));
  if (!validSeo)
    throw new Error("VITE_SITE_URL or VITE_SEO_INDEXING is invalid for this environment.");
}

export function validatePagesProject(project: unknown): void {
  if (
    typeof project !== "object" ||
    project === null ||
    !("name" in project) ||
    project.name !== "vhsboard" ||
    !("subdomain" in project) ||
    project.subdomain !== "vhsboard.pages.dev" ||
    !("production_branch" in project) ||
    project.production_branch !== "main"
  ) {
    throw new Error("Pages project must be vhsboard with production_branch main.");
  }
}

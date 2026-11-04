import { appendFile, writeFile } from "node:fs/promises";

import {
  resolveDeploymentTarget,
  validatePagesProject,
  type DeploymentTarget,
} from "./deployment-config";

type Environment = Record<string, string | undefined>;
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};

export function validatePagesDeploymentUrl(value: string): string {
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      /^(?:[a-z0-9-]+\.)?vhsboard\.pages\.dev$/.test(url.hostname) &&
      (value === url.origin || value === `${url.origin}/`)
    )
      return url.origin;
  } catch {
    /* A fixed message below avoids echoing credentials in a malformed URL. */
  }
  throw new Error("Invalid Pages deployment URL.");
}

export function validatePagesDeployment(
  input: unknown,
  target: DeploymentTarget,
  commit: string,
): void {
  const deployment = record(input);
  const metadata = record(record(deployment["deployment_trigger"])["metadata"]);
  if (
    deployment["environment"] !==
      (target.environment === "production" ? "production" : "preview") ||
    metadata["branch"] !== target.branch ||
    metadata["commit_hash"] !== commit ||
    record(deployment["latest_stage"])["status"] !== "success"
  )
    throw new Error("Pages deployment does not match the expected branch, commit or environment.");
}

export function validateDeploymentVersion(
  input: unknown,
  target: DeploymentTarget,
  commit: string,
): void {
  const version = record(input);
  if (
    version["commit"] !== commit ||
    version["branch"] !== target.branch ||
    version["environment"] !== target.environment
  ) {
    throw new Error("The served Pages version does not match this deployment.");
  }
}

async function readPagesApi(
  environment: Environment,
  suffix: string,
  fetcher: typeof fetch,
): Promise<unknown> {
  const account = environment["CLOUDFLARE_ACCOUNT_ID"];
  const token = environment["CLOUDFLARE_API_TOKEN"];
  if (!account?.trim() || !token?.trim())
    throw new Error("Missing Cloudflare deployment credentials.");
  try {
    const response = await fetcher(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/pages/projects/vhsboard${suffix}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok) throw new Error();
    const body = record(await response.json());
    if (body["success"] !== true || !("result" in body)) throw new Error();
    return body["result"];
  } catch {
    throw new Error(
      "Cloudflare API request failed; check credentials, permissions and connectivity.",
    );
  }
}

export async function checkPagesProject(
  environment: Environment,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  validatePagesProject(await readPagesApi(environment, "", fetcher));
}

export async function verifyPagesDeployment(
  environment: Environment,
  fetcher: typeof fetch = fetch,
) {
  const target = resolveDeploymentTarget(environment["GITHUB_REF"] ?? "");
  const commit = environment["GITHUB_SHA"] ?? "";
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("Invalid deployment commit.");
  const url = validatePagesDeploymentUrl(environment["DEPLOYMENT_URL"] ?? "");
  const pagesEnvironment = target.environment === "production" ? "production" : "preview";
  const deployments = await readPagesApi(
    environment,
    `/deployments?env=${pagesEnvironment}&per_page=20`,
    fetcher,
  );
  const deployment = Array.isArray(deployments)
    ? deployments.find((item: unknown) => record(item)["url"] === url)
    : undefined;
  validatePagesDeployment(deployment, target, commit);
  const alias =
    target.environment === "development"
      ? "https://develop.vhsboard.pages.dev"
      : (environment["VITE_SITE_URL"] ?? "https://vhsboard.pages.dev");
  if (
    ![
      "https://develop.vhsboard.pages.dev",
      "https://vhsboard.pages.dev",
      "https://vhsboard.pl",
    ].includes(alias)
  ) {
    throw new Error("Invalid public deployment origin.");
  }
  for (const origin of [url, alias]) {
    let version: unknown;
    try {
      const response = await fetcher(`${origin}/_deployment.json?commit=${commit}`, {
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error();
      version = await response.json();
    } catch {
      throw new Error("The deployed Pages version is not reachable.");
    }
    validateDeploymentVersion(version, target, commit);
  }
  return { url, alias, commit, ...target };
}

if (import.meta.main) {
  try {
    const mode = process.argv[2];
    if (mode === "project") {
      await checkPagesProject(process.env);
      console.log("Pages project verified: production_branch main.");
    } else if (mode === "stamp") {
      const target = resolveDeploymentTarget(process.env["GITHUB_REF"] ?? "");
      const commit = process.env["GITHUB_SHA"] ?? "";
      if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("Invalid deployment commit.");
      await writeFile(".output/public/_deployment.json", JSON.stringify({ commit, ...target }));
    } else if (mode === "verify") {
      let verified: Awaited<ReturnType<typeof verifyPagesDeployment>> | undefined;
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          verified = await verifyPagesDeployment(process.env);
          break;
        } catch (error) {
          if (attempt === 5) throw error;
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
      if (!verified) throw new Error("Pages verification failed.");
      const summary = `### Pages deployment verified\n\n- Environment: ${verified.environment}\n- Branch: ${verified.branch}\n- Commit: ${verified.commit}\n- Deployment: ${verified.url}\n- Public URL: ${verified.alias}\n`;
      const summaryPath = process.env["GITHUB_STEP_SUMMARY"];
      if (summaryPath) await appendFile(summaryPath, summary);
      console.log(summary);
    } else {
      throw new Error("Expected Pages check mode: project, stamp or verify.");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Pages deployment check failed.");
    process.exitCode = 1;
  }
}

import { describe, expect, it, vi } from "vitest";

import {
  checkPagesProject,
  validatePagesDeployment,
  validatePagesDeploymentUrl,
  validateDeploymentVersion,
  verifyPagesDeployment,
} from "./pages-deployment";

const target = { branch: "develop", environment: "development" } as const;
const commit = "a".repeat(40);
const url = "https://1234abcd.vhsboard.pages.dev";
const alias = "https://develop.vhsboard.pages.dev";
const project = { name: "vhsboard", subdomain: "vhsboard.pages.dev", production_branch: "main" };
const version = { commit, ...target };
const deployment = {
  url,
  environment: "preview",
  deployment_trigger: { metadata: { branch: "develop", commit_hash: commit } },
  latest_stage: { status: "success" },
};
const env = {
  GITHUB_REF: "refs/heads/develop",
  GITHUB_SHA: commit,
  CLOUDFLARE_ACCOUNT_ID: "test-account",
  CLOUDFLARE_API_TOKEN: "private-cloudflare-token",
  DEPLOYMENT_URL: url,
};

describe("Pages deployment verification", () => {
  it.each([url, `${url}/`, "https://vhsboard.pages.dev"])("accepts project URL %s", (input) => {
    expect(validatePagesDeploymentUrl(input)).toBe(input.replace(/\/$/, ""));
  });
  it.each([
    "http://1234abcd.vhsboard.pages.dev",
    "https://other.pages.dev",
    "https://vhsboard.pages.dev.evil.test",
    "https://user:secret@vhsboard.pages.dev",
    `${url}/path`,
    `${url}?token=secret`,
    `${url}#fragment`,
    "https://vhsboard.pages.dev:444",
    "https://nested.develop.vhsboard.pages.dev",
  ])("rejects unsafe deployment URL %s", (input) => {
    expect(() => validatePagesDeploymentUrl(input)).toThrow();
  });

  it("accepts matching preview metadata", () => {
    expect(() => validatePagesDeployment(deployment, target, commit)).not.toThrow();
  });
  it.each([
    { ...deployment, environment: "production" },
    { ...deployment, latest_stage: { status: "failure" } },
    { ...deployment, deployment_trigger: { metadata: { branch: "main", commit_hash: commit } } },
    { ...deployment, deployment_trigger: { metadata: { branch: "develop", commit_hash: "old" } } },
    null,
  ])("rejects wrong branch, commit, status or environment: %j", (input) => {
    expect(() => validatePagesDeployment(input, target, commit)).toThrow();
  });
  it("accepts production metadata only for main", () => {
    expect(() =>
      validatePagesDeployment(
        {
          ...deployment,
          environment: "production",
          deployment_trigger: { metadata: { branch: "main", commit_hash: commit } },
        },
        { branch: "main", environment: "production" },
        commit,
      ),
    ).not.toThrow();
  });

  it("checks the version served by the stable alias", () => {
    expect(() => validateDeploymentVersion(version, target, commit)).not.toThrow();
    expect(() =>
      validateDeploymentVersion({ ...version, commit: "old" }, target, commit),
    ).toThrow();
    expect(() =>
      validateDeploymentVersion({ ...version, branch: "main" }, target, commit),
    ).toThrow();
    expect(() => validateDeploymentVersion(null, target, commit)).toThrow();
  });

  it("checks project settings through authenticated Pages API", async () => {
    const fetcher = vi.fn(async () => Response.json({ success: true, result: project }));
    await expect(checkPagesProject(env, fetcher)).resolves.toBeUndefined();
    const [requestUrl, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(requestUrl).hostname).toBe("api.cloudflare.com");
    expect(new Headers(init.headers).get("Authorization")).toBe(
      `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    );
  });

  it("does not expose a response body or token when the API fails", async () => {
    const fetcher = async () => new Response(env.CLOUDFLARE_API_TOKEN, { status: 403 });
    await expect(checkPagesProject(env, fetcher)).rejects.toThrow("Cloudflare API request failed");
    try {
      await checkPagesProject(env, fetcher);
    } catch (error) {
      expect(String(error)).not.toContain(env.CLOUDFLARE_API_TOKEN);
    }
  });

  it("blocks an API envelope reporting failure even with HTTP 200", async () => {
    await expect(
      checkPagesProject(env, async () => Response.json({ success: false, result: project })),
    ).rejects.toThrow();
  });

  it("verifies API metadata and exact/stable URLs without sending tokens to public hosts", async () => {
    const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
      const requestUrl = new URL(String(input));
      if (requestUrl.hostname === "api.cloudflare.com") {
        return Response.json({ success: true, result: [deployment] });
      }
      expect(new Headers(init?.headers).has("Authorization")).toBe(false);
      expect([new URL(url).hostname, new URL(alias).hostname]).toContain(requestUrl.hostname);
      return Response.json(version);
    };
    await expect(verifyPagesDeployment(env, fetcher)).resolves.toEqual({ url, alias, ...version });
  });

  it("rejects mismatched API metadata before checking the public alias", async () => {
    await expect(
      verifyPagesDeployment(env, async () =>
        Response.json({ success: true, result: [{ ...deployment, environment: "production" }] }),
      ),
    ).rejects.toThrow();
  });
});

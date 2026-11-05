import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

type ApiObject = { type?: string; sha?: string };
type ApiResponse = {
  object?: ApiObject;
  tag_name?: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
  html_url?: string;
};
export type Request = (method: string, path: string, body?: unknown) => Promise<ApiResponse | null>;
const notePattern = /^docs\/releases\/(\d{4}-\d{2}-\d{2})\.([1-9]\d*)\.md$/;

export function chooseNotes(paths: string[]): { id: string; path: string } | null {
  const candidates = paths.filter((path) => path.startsWith("docs/releases/"));
  if (!candidates.length) return null;
  if (candidates.length !== 1) throw new Error("Ambiguous release notes");
  const path = candidates[0]!;
  const match = notePattern.exec(path);
  if (!match) throw new Error("Invalid release notes path");
  const date = new Date(`${match[1]}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== match[1])
    throw new Error("Invalid release date");
  return { id: `${match[1]}.${match[2]}`, path };
}

export async function publishRelease(
  request: Request,
  id: string,
  sha: string,
  body: string,
): Promise<string> {
  if (!/^[0-9a-f]{40}$/.test(sha) || !body.trim()) throw new Error("Invalid SHA or empty notes");
  const tag = `v${id}`;
  const ref = await request("GET", `/git/ref/tags/${tag}`);
  if (ref) {
    let object = ref.object;
    for (let depth = 0; object?.type === "tag" && depth < 8; depth++) {
      object = (await request("GET", `/git/tags/${object.sha}`))?.object;
    }
    if (object?.type !== "commit" || object.sha !== sha)
      throw new Error("Existing tag points to a different commit");
  }
  const existing = await request("GET", `/releases/tags/${tag}`);
  if (existing) {
    if (
      !ref ||
      existing.tag_name !== tag ||
      existing.name !== id ||
      existing.body !== body ||
      existing.draft !== false ||
      existing.prerelease !== false ||
      typeof existing.html_url !== "string"
    )
      throw new Error("Existing release conflicts with expected metadata");
    return existing.html_url;
  }
  if (!ref) {
    await request("POST", "/git/refs", { ref: `refs/tags/${tag}`, sha });
  }
  const release = await request("POST", "/releases", {
    tag_name: tag,
    name: id,
    body,
    draft: false,
    prerelease: false,
    make_latest: "false",
  });
  if (typeof release?.html_url !== "string") throw new Error("Release response lacks URL");
  return release.html_url;
}

export function readDeployedNotes(
  sha: string,
  cwd: string,
): { notes: { id: string; path: string }; body: string } | null {
  const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8", cwd }).trim();
  if (git("rev-parse", "HEAD") !== sha) throw new Error("Checkout does not match deployed SHA");
  const parent = git("rev-parse", `${sha}^1`);
  const paths = git(
    "diff",
    "--diff-filter=A",
    "--name-only",
    "-z",
    parent,
    sha,
    "--",
    "docs/releases/",
  )
    .split("\0")
    .filter(Boolean);
  const notes = chooseNotes(paths);
  if (!notes) {
    console.log("No new release notes; skipping publication.");
    return null;
  }
  const body = execFileSync("git", ["show", `${sha}:${notes.path}`], { encoding: "utf8", cwd });
  return { notes, body };
}

async function main() {
  if (process.env["GITHUB_REF"] !== "refs/heads/main")
    throw new Error("Publication is restricted to main");
  const sha = process.env["GITHUB_SHA"];
  const repository = process.env["GITHUB_REPOSITORY"];
  const token = process.env["GH_TOKEN"];
  if (
    !sha ||
    !repository ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository) ||
    !token ||
    !/^[0-9a-f]{40}$/.test(sha)
  )
    throw new Error("Missing GitHub context");
  const result = readDeployedNotes(sha, process.cwd());
  if (!result) return;
  const { notes, body } = result;
  const request: Request = async (method, path, payload) => {
    const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    if (response.status === 404 && method === "GET") return null;
    if (!response.ok) throw new Error(`GitHub API ${method} ${path}: HTTP ${response.status}`);
    return (await response.json()) as ApiResponse;
  };
  // Verify repository access first: GitHub can conceal inaccessible resources as 404.
  const repositoryInfo = await request("GET", "");
  if (!repositoryInfo) throw new Error("GitHub repository is inaccessible");
  const url = await publishRelease(request, notes.id, sha, body);
  console.log(`Published release: ${url}`);
  if (process.env["GITHUB_STEP_SUMMARY"])
    appendFileSync(process.env["GITHUB_STEP_SUMMARY"], `\nGitHub Release: ${url}\n`);
}

if (import.meta.main)
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });

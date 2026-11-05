import { describe, expect, it, vi } from "vitest";
import { chooseNotes, publishRelease } from "./publish-github-release";

describe("release publication", () => {
  it("skips ordinary commits and rejects ambiguous or invalid release notes", () => {
    expect(chooseNotes([])).toBeNull();
    expect(() => chooseNotes(["docs/releases/2026-02-30.1.md"])).toThrow();
    expect(() =>
      chooseNotes(["docs/releases/2026-11-05.1.md", "docs/releases/2026-11-05.2.md"]),
    ).toThrow();
  });
  it("creates the exact tag and release and returns its URL", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ html_url: "https://github.com/o/r/releases/tag/v2026-11-05.1" });
    expect(await publishRelease(request, "2026-11-05.1", "a".repeat(40), "notes\n")).toContain(
      "/releases/tag/",
    );
    expect(request).toHaveBeenNthCalledWith(3, "POST", "/git/refs", {
      ref: "refs/tags/v2026-11-05.1",
      sha: "a".repeat(40),
    });
    expect(request).toHaveBeenNthCalledWith(4, "POST", "/releases", {
      tag_name: "v2026-11-05.1",
      name: "2026-11-05.1",
      body: "notes\n",
      draft: false,
      prerelease: false,
      make_latest: "false",
    });
  });
  it("resumes after tag creation and accepts only a matching published release", async () => {
    const sha = "a".repeat(40);
    const request = vi
      .fn()
      .mockResolvedValueOnce({ object: { type: "commit", sha } })
      .mockResolvedValueOnce({
        tag_name: "v2026-11-05.1",
        name: "2026-11-05.1",
        body: "notes",
        draft: false,
        prerelease: false,
        html_url: "https://github.com/o/r/releases/tag/v2026-11-05.1",
      });
    expect(await publishRelease(request, "2026-11-05.1", sha, "notes")).toContain("/releases/tag/");
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("refuses conflicting tags and release content without writes", async () => {
    const sha = "a".repeat(40);
    const badTag = vi.fn().mockResolvedValue({ object: { type: "commit", sha: "b".repeat(40) } });
    await expect(publishRelease(badTag, "2026-11-05.1", sha, "notes")).rejects.toThrow();
    expect(badTag).toHaveBeenCalledTimes(1);
    const badBody = vi
      .fn()
      .mockResolvedValueOnce({ object: { type: "commit", sha } })
      .mockResolvedValueOnce({ body: "wrong" });
    await expect(publishRelease(badBody, "2026-11-05.1", sha, "notes")).rejects.toThrow();
    expect(badBody).toHaveBeenCalledTimes(2);
  });
});

it("reads newly added notes from the first parent of merge and squash commits", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const { readDeployedNotes } = await import("./publish-github-release");
  const cwd = mkdtempSync(join(tmpdir(), "vhs-release-git-"));
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  try {
    git("init", "-b", "main");
    git("config", "user.email", "test@example.test");
    git("config", "user.name", "Test");
    writeFileSync(join(cwd, "base"), "base");
    git("add", ".");
    git("commit", "-m", "base");
    const base = git("rev-parse", "HEAD");
    git("switch", "-c", "release");
    mkdirSync(join(cwd, "docs/releases"), { recursive: true });
    writeFileSync(join(cwd, "docs/releases/2026-11-05.1.md"), "notes\n");
    git("add", ".");
    git("commit", "-m", "notes");
    git("switch", "main");
    git("merge", "--no-ff", "release", "-m", "merge");
    const merged = git("rev-parse", "HEAD");
    expect(readDeployedNotes(merged, cwd)?.body).toBe("notes\n");
    expect(() => readDeployedNotes(base, cwd)).toThrow("Checkout does not match");
    writeFileSync(join(cwd, "docs/releases/2026-11-05.1.md"), "changed\n");
    git("commit", "-am", "modify");
    expect(readDeployedNotes(git("rev-parse", "HEAD"), cwd)).toBeNull();
    git("reset", "--hard", base);
    git("merge", "--squash", "release");
    git("commit", "-m", "squash");
    expect(readDeployedNotes(git("rev-parse", "HEAD"), cwd)?.notes.id).toBe("2026-11-05.1");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

it("does not repair a missing tag when a release already exists", async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ tag_name: "v2026-11-05.1" });
  await expect(publishRelease(request, "2026-11-05.1", "a".repeat(40), "notes")).rejects.toThrow();
  expect(request).toHaveBeenCalledTimes(2);
});

it("resumes from an existing annotated tag without recreating it", async () => {
  const sha = "a".repeat(40);
  const request = vi
    .fn()
    .mockResolvedValueOnce({ object: { type: "tag", sha: "b".repeat(40) } })
    .mockResolvedValueOnce({ object: { type: "commit", sha } })
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ html_url: "https://github.com/o/r/releases/tag/v2026-11-05.1" });
  await publishRelease(request, "2026-11-05.1", sha, "notes");
  expect(request).toHaveBeenCalledTimes(4);
  expect(request).toHaveBeenNthCalledWith(4, "POST", "/releases", {
    tag_name: "v2026-11-05.1",
    name: "2026-11-05.1",
    body: "notes",
    draft: false,
    prerelease: false,
    make_latest: "false",
  });
});

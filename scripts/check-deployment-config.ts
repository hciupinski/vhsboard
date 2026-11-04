import { appendFileSync } from "node:fs";

import { resolveDeploymentTarget, validateDeploymentEnvironment } from "./deployment-config";

try {
  const target = resolveDeploymentTarget(process.env["GITHUB_REF"] ?? "");
  if (process.argv[2] === "resolve") {
    const output = process.env["GITHUB_OUTPUT"];
    if (!output) throw new Error("Missing GITHUB_OUTPUT.");
    appendFileSync(output, `environment=${target.environment}\nbranch=${target.branch}\n`);
  } else {
    validateDeploymentEnvironment(target, process.env);
    console.log(`Deployment configuration verified: ${target.environment}.`);
  }
} catch (error) {
  // Only the pure validator's fixed messages are allowed into CI logs.
  console.error(error instanceof Error ? error.message : "Invalid deployment configuration.");
  process.exitCode = 1;
}

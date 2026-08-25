export const isBuildOnly = (environment: Record<string, string | undefined>): boolean =>
  environment.VHSBOARD_BUILD_ONLY === "true";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

import { isBuildOnly } from "./scripts/build-mode";

const staticPublicPaths = ["/", "/o-nas", "/wyjazdy", "/eventy", "/polkolonie", "/kontakt"];
const spaShellMaskPath = "/spa-shell";

export default defineConfig(async ({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const buildOnly = isBuildOnly(environment);
  const allowedPaths = new Set(
    buildOnly ? staticPublicPaths : [...staticPublicPaths, spaShellMaskPath],
  );
  const prerenderPages = buildOnly ? [] : staticPublicPaths.map((path) => ({ path }));

  return {
    plugins: [
      tsConfigPaths(),
      tanstackStart({
        server: { entry: "server" },
        router: {
          routeFileIgnorePattern: "\\.test\\.(ts|tsx)$",
        },
        // Detail routes receive a static SPA shell and then fetch the current
        // published offer from Supabase in the browser. Marketing routes below
        // remain prerendered as normal static HTML.
        spa: {
          enabled: !buildOnly,
          // Keep / available for the prerendered home page. The internal route
          // below exists only as a valid render target while the shell is made.
          maskPath: spaShellMaskPath,
        },
        prerender: {
          enabled: !buildOnly,
          autoSubfolderIndex: true,
          autoStaticPathsDiscovery: true,
          crawlLinks: true,
          concurrency: 4,
          retryCount: 2,
          retryDelay: 1000,
          failOnError: true,
          filter: ({ path }) => allowedPaths.has(path),
        },
        pages: prerenderPages,
      }),
      nitro(),
      viteReact(),
      tailwindcss(),
    ],
  };
});

import tailwindcss from "@tailwindcss/vite";
import { createClient } from "@supabase/supabase-js";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

import { getPublicSupabaseConfigFrom, getSeoConfigFrom } from "./src/lib/env";
import { publishedOfferSeoRowSchema } from "./src/lib/offers/schema";
import { isBuildOnly } from "./scripts/build-mode";

const staticPublicPaths = ["/", "/o-nas", "/wyjazdy", "/eventy", "/polkolonie", "/kontakt"];

const getPublishedOfferPaths = async (environment: Record<string, string>): Promise<string[]> => {
  const config = getPublicSupabaseConfigFrom(environment);
  getSeoConfigFrom(environment);
  const client = createClient(config.url, config.anonKey);
  const { data, error } = await client
    .from("offers")
    .select("slug,updated_at,offer_kind")
    .eq("status", "published");

  if (error || !Array.isArray(data)) {
    throw new Error("Nie udało się pobrać opublikowanych slugów do prerenderingu.", {
      cause: error,
    });
  }

  return data.map((row) => {
    const offer = publishedOfferSeoRowSchema.parse(row);
    return `${offer.offer_kind === "day_camp" ? "/polkolonie" : "/wyjazdy"}/${offer.slug}`;
  });
};

export default defineConfig(async ({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const buildOnly = isBuildOnly(environment);
  const publishedOfferPaths = buildOnly ? [] : await getPublishedOfferPaths(environment);
  const allowedPaths = new Set([...staticPublicPaths, ...publishedOfferPaths]);
  const prerenderPages = buildOnly
    ? []
    : [...staticPublicPaths, ...publishedOfferPaths].map((path) => ({ path }));

  return {
    plugins: [
      tsConfigPaths(),
      tanstackStart({
        server: { entry: "server" },
        router: {
          routeFileIgnorePattern: "\\.test\\.(ts|tsx)$",
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

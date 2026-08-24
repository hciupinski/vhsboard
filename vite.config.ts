import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      server: { entry: "server" },
      router: {
        routeFileIgnorePattern: "\\.test\\.(ts|tsx)$",
      },
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
        failOnError: true,
      },
      pages: [
        {
          path: "/",
          prerender: {
            enabled: true,
            outputPath: "/index.html",
          },
        },
      ],
    }),
    nitro(),
    viteReact(),
    tailwindcss(),
  ],
});

import { defineConfig, loadEnv } from "vite";
import { sentryVitePlugin } from "@sentry/bundler-plugins/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const uploadSourceMaps = Boolean(
    env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT,
  );
  return {
    base: "/chaos-crawl/",

    plugins: [
      react(),
      tailwindcss(),
      ...(uploadSourceMaps
        ? [
            sentryVitePlugin({
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT,
              authToken: env.SENTRY_AUTH_TOKEN,
              telemetry: false,
              release: { name: env.VITE_SENTRY_RELEASE || undefined },
              sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
            }),
          ]
        : []),
    ],

    build: { sourcemap: uploadSourceMaps ? "hidden" : false },

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});

import { defineConfig, loadEnv } from "vite";
import { sentryVitePlugin } from "@sentry/bundler-plugins/vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import type { Plugin } from "vite";

const base = "/chaos-crawl/";

interface OpenMojiAssetRecord {
  hexcode: string;
  unicode: number | string;
  skintone?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOpenMojiAssetRecord(value: unknown): value is OpenMojiAssetRecord {
  return (
    isRecord(value) &&
    typeof value.hexcode === "string" &&
    (typeof value.unicode === "number" || typeof value.unicode === "string") &&
    (value.skintone === undefined || typeof value.skintone === "string")
  );
}

function openMojiAssets(base: string): Plugin {
  const packagePath = resolve(process.cwd(), "node_modules/openmoji");
  const data: unknown = JSON.parse(
    readFileSync(resolve(packagePath, "data/openmoji.json"), "utf8"),
  );
  if (!Array.isArray(data)) {
    throw new Error("OpenMoji metadata must be an array.");
  }
  const emojis = data.filter(
    (entry): entry is OpenMojiAssetRecord =>
      isOpenMojiAssetRecord(entry) &&
      Number(entry.unicode) > 0 &&
      !entry.skintone,
  );
  if (emojis.length === 0) {
    throw new Error("No standard OpenMoji assets were found.");
  }
  const allowedCodes = new Set(emojis.map((emoji) => emoji.hexcode));
  const colorDirectory = resolve(packagePath, "color/svg");
  return {
    name: "openmoji-static-assets",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://localhost")
          .pathname;
        const relativePath = pathname.startsWith(base)
          ? pathname.slice(base.length)
          : pathname.replace(/^\/+/, "");
        const match = /^openmoji\/([A-F0-9-]+)\.svg$/.exec(relativePath);
        const code = match?.[1];
        if (!code || !allowedCodes.has(code)) {
          next();
          return;
        }
        response.setHeader("Content-Type", "image/svg+xml");
        response.end(readFileSync(resolve(colorDirectory, `${code}.svg`)));
      });
    },
    writeBundle(outputOptions) {
      if (!outputOptions.dir) {
        throw new Error("OpenMoji assets require a directory build output.");
      }
      const outputDirectory = resolve(outputOptions.dir, "openmoji");
      mkdirSync(outputDirectory, { recursive: true });
      for (const emoji of emojis) {
        copyFileSync(
          resolve(colorDirectory, `${emoji.hexcode}.svg`),
          resolve(outputDirectory, `${emoji.hexcode}.svg`),
        );
      }
    },
  };
}

// The catalog ships many fields the app never reads; keep only what
// src/lib/openmoji.ts uses so the bundled chunk stays small.
function slimOpenMojiCatalog(): Plugin {
  const keep = [
    "emoji",
    "hexcode",
    "annotation",
    "tags",
    "openmoji_tags",
    "order",
    "unicode",
    "skintone",
  ];
  return {
    name: "slim-openmoji-catalog",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith("openmoji/data/openmoji.json")) return null;
      const data: unknown = JSON.parse(code);
      if (!Array.isArray(data)) return null;
      const slim = data
        .filter(isRecord)
        .map((entry) =>
          Object.fromEntries(keep.map((key) => [key, entry[key]])),
        );
      return { code: JSON.stringify(slim), map: null };
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const uploadSourceMaps = Boolean(
    env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT,
  );
  return {
    base,

    plugins: [
      react(),
      openMojiAssets(base),
      slimOpenMojiCatalog(),
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

    build: {
      sourcemap: uploadSourceMaps ? "hidden" : false,
      // The OpenMoji catalogue is one ~840 kB (114 kB gzip) chunk of searchable
      // emoji data, loaded separately from the app code.
      chunkSizeWarningLimit: 900,
    },

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});

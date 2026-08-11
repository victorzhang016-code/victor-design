import { build } from "esbuild";
import { mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });

await Promise.all([
  build({
    entryPoints: ["src/plugin/index.ts"],
    outfile: "code.js",
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    sourcemap: false,
    legalComments: "none"
  }),
  build({
    entryPoints: ["src/capture/browser.ts"],
    outfile: "snapshot-ui.js",
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    sourcemap: false,
    legalComments: "none"
  }),
  build({
    entryPoints: ["src/cli.ts"],
    outfile: "dist/cli.js",
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    packages: "external",
    sourcemap: true,
    legalComments: "none"
  })
]);

#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium, type Browser, type Page } from "playwright";
import { DomMigratePackageV3Schema, type DomMigratePackageV3, type IrNode } from "./shared/schema";
import { validateIr } from "./shared/invariants";

type CliOptions = {
  input: string;
  output: string;
  states: string[];
  viewport: { width: number; height: number };
  rootSelector?: string;
  readyExpression?: string;
  strict: boolean;
  channel?: string;
};

function help(): never {
  console.log(`DOM Migrate v3 capture

Usage:
  npm run capture -- --input <html-or-url> --output <directory> [options]

Options:
  --states view,sheet,profile,quiet   Query-string states (default: default)
  --viewport 390x844                 Browser viewport
  --root "[data-figma-root]"         Capture root selector
  --ready "window.__UI_READY__"      Optional JavaScript ready expression
  --channel chrome                   Playwright browser channel
  --strict                          Fail when compatibility hard errors exist (default)
  --no-strict                        Emit a package even with hard errors
`);
  process.exit(0);
}

export function parseArgs(argv: string[]): CliOptions {
  const values = new Map<string, string>();
  let strict = true;
  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (value === "--help" || value === "-h") help();
    if (value === "--strict") { strict = true; continue; }
    if (value === "--no-strict") { strict = false; continue; }
    if (!value.startsWith("--")) continue;
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) throw new Error(`Missing value for ${value}`);
    values.set(value.slice(2), next);
    index++;
  }
  const input = values.get("input");
  const output = values.get("output") || values.get("out");
  if (!input || !output) throw new Error("--input and --output are required");
  const viewportMatch = (values.get("viewport") || "390x844").match(/^(\d+)x(\d+)$/i);
  if (!viewportMatch) throw new Error("--viewport must use WIDTHxHEIGHT, for example 390x844");
  return {
    input,
    output,
    states: (values.get("states") || "default").split(",").map((state) => state.trim()).filter(Boolean),
    viewport: { width: Number(viewportMatch[1]), height: Number(viewportMatch[2]) },
    rootSelector: values.get("root"),
    readyExpression: values.get("ready"),
    strict,
    channel: values.get("channel")
  };
}

function targetUrl(input: string, state: string): string {
  const base = /^https?:\/\//i.test(input) || /^file:/i.test(input) ? input : pathToFileURL(path.resolve(input)).href;
  const url = new URL(base);
  if (state !== "default") url.searchParams.set("state", state);
  return url.href;
}

async function waitUntilReady(page: Page, expression?: string): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    })));
  });
  if (expression) await page.waitForFunction(expression, undefined, { timeout: 15_000 });
  else await page.waitForFunction(() => document.documentElement.getAttribute("data-ui-ready") !== "false" && (window as unknown as { __DOM_MIGRATE_READY__?: boolean }).__DOM_MIGRATE_READY__ !== false, undefined, { timeout: 15_000 });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

function walk(node: IrNode, visitor: (node: IrNode) => void): void {
  visitor(node);
  node.children.forEach((child) => walk(child, visitor));
}

async function captureAssets(page: Page, root: IrNode, images: Record<string, string>): Promise<void> {
  const jobs: IrNode[] = [];
  walk(root, (node) => { if (node.image?.assetKey.startsWith("pending:") || node.raster?.assetKey.startsWith("pending:")) jobs.push(node); });
  for (const node of jobs) {
    const locator = page.locator(`[data-dom-migrate-id="${node.id}"]`).first();
    if (await locator.count() !== 1) throw new Error(`Asset source is missing for ${node.name} (${node.id})`);
    const png = await locator.screenshot({ type: "png", omitBackground: true, animations: "disabled" });
    const key = `asset-${createHash("sha256").update(png).digest("hex").slice(0, 20)}`;
    images[key] = png.toString("base64");
    if (node.image) node.image.assetKey = key;
    if (node.raster) node.raster.assetKey = key;
  }
}

function mergeFonts(target: DomMigratePackageV3["compatibility"]["fonts"], source: DomMigratePackageV3["compatibility"]["fonts"]): void {
  for (const font of source) {
    const existing = target.find((candidate) => candidate.family === font.family && candidate.weight === font.weight && candidate.style === font.style);
    if (existing) existing.nodes = Array.from(new Set([...existing.nodes, ...font.nodes])).sort();
    else target.push({ ...font, nodes: [...font.nodes] });
  }
}

async function launchBrowser(channel?: string): Promise<Browser> {
  try {
    return await chromium.launch({ headless: true, channel: channel as "chrome" | "msedge" | undefined });
  } catch (error) {
    if (channel) throw error;
    return chromium.launch({ headless: true, channel: process.platform === "win32" ? "chrome" : undefined });
  }
}

export async function capture(options: CliOptions): Promise<DomMigratePackageV3> {
  const output = path.resolve(options.output);
  const goldenDirectory = path.join(output, "goldens");
  await mkdir(goldenDirectory, { recursive: true });
  const browser = await launchBrowser(options.channel);
  const pages: DomMigratePackageV3["pages"] = [];
  const images: Record<string, string> = {};
  const warnings: DomMigratePackageV3["compatibility"]["warnings"] = [];
  const errors: DomMigratePackageV3["compatibility"]["errors"] = [];
  const fonts: DomMigratePackageV3["compatibility"]["fonts"] = [];
  const rasterLayers: DomMigratePackageV3["compatibility"]["rasterLayers"] = [];
  let variables: DomMigratePackageV3["variables"] = { colors: {}, spacing: {}, radius: {} };
  try {
    const context = await browser.newContext({ viewport: options.viewport, deviceScaleFactor: 1, colorScheme: "light", locale: "zh-CN" });
    for (const state of options.states) {
      const page = await context.newPage();
      const url = targetUrl(options.input, state);
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await waitUntilReady(page, options.readyExpression);
      const browserBundle = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "snapshot-ui.js");
      await page.addScriptTag({ path: browserBundle });
      const result = await page.evaluate(async ({ pageName, rootSelector }) => {
        if (!window.DOMMigrateV3) throw new Error("snapshot-ui.js did not expose window.DOMMigrateV3");
        return window.DOMMigrateV3.capture({ pageName, rootSelector, strict: true });
      }, { pageName: state, rootSelector: options.rootSelector });
      await captureAssets(page, result.page.root, images);
      const rasterAssetById = new Map<string, string>();
      walk(result.page.root, (node) => { if (node.raster) rasterAssetById.set(node.id, node.raster.assetKey); });
      const goldenName = `${state.replace(/[^a-z0-9_-]+/gi, "-")}.png`;
      await page.screenshot({ path: path.join(goldenDirectory, goldenName), animations: "disabled" });
      result.page.golden = `goldens/${goldenName}`;
      pages.push(result.page);
      Object.assign(variables.colors, result.variables.colors);
      Object.assign(variables.spacing, result.variables.spacing);
      Object.assign(variables.radius, result.variables.radius);
      warnings.push(...result.compatibility.warnings);
      errors.push(...result.compatibility.errors);
      mergeFonts(fonts, result.compatibility.fonts);
      rasterLayers.push(...result.compatibility.rasterLayers.map((layer) => ({ ...layer, assetKey: rasterAssetById.get(layer.nodeId) || layer.assetKey })));
      await page.close();
    }
  } finally {
    await browser.close();
  }
  const pkg: DomMigratePackageV3 = {
    schemaVersion: 3,
    generator: { name: "DOM Migrate", version: "3.0.0" },
    capturedAt: process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString() : new Date().toISOString(),
    source: { url: targetUrl(options.input, "default"), viewport: options.viewport },
    pages,
    images,
    variables,
    compatibility: { warnings, errors, fonts, rasterLayers }
  };
  DomMigratePackageV3Schema.parse(pkg);
  const validation = validateIr(pkg);
  pkg.compatibility.errors.push(...validation.errors);
  pkg.compatibility.warnings.push(...validation.warnings);
  if (options.strict && pkg.compatibility.errors.length) {
    const summary = pkg.compatibility.errors.map((item) => `${item.code}: ${item.message}`).join("\n");
    throw new Error(`Strict capture failed:\n${summary}`);
  }
  await writeFile(path.join(output, "dom-migrate.v3.json"), `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  await writeFile(path.join(output, "compatibility-report.json"), `${JSON.stringify(pkg.compatibility, null, 2)}\n`, "utf8");
  return pkg;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  capture(parseArgs(process.argv.slice(2))).then((pkg) => {
    const raster = pkg.compatibility.rasterLayers.length;
    const warnings = pkg.compatibility.warnings.length;
    console.log(`DOM Migrate v3 captured ${pkg.pages.length} state(s), ${Object.keys(pkg.images).length} asset(s), ${raster} raster layer(s), ${warnings} warning(s).`);
  }).catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 1;
  });
}

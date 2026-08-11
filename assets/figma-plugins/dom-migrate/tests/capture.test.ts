import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { capture } from "../src/cli";
import type { IrNode } from "../src/shared/schema";

const directories: string[] = [];
const fixture = path.resolve("tests/fixtures/controlled-ui.html");

function find(root: IrNode, name: string): IrNode | undefined {
  if (root.name === name) return root;
  for (const child of root.children) {
    const result = find(child, name);
    if (result) return result;
  }
}

beforeAll(() => { process.env.SOURCE_DATE_EPOCH = "1786406400"; });
afterAll(async () => { await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true }))); delete process.env.SOURCE_DATE_EPOCH; });

describe("deterministic Playwright capture", () => {
  it("emits identical v3 IR and golden image hashes across consecutive runs", async () => {
    const first = await mkdtemp(path.join(tmpdir(), "dom-migrate-v3-a-"));
    const second = await mkdtemp(path.join(tmpdir(), "dom-migrate-v3-b-"));
    directories.push(first, second);
    const options = { input: fixture, output: first, states: ["default"], viewport: { width: 390, height: 844 }, strict: true };
    const a = await capture(options);
    const b = await capture({ ...options, output: second });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const goldenA = await readFile(path.join(first, "goldens/default.png"));
    const goldenB = await readFile(path.join(second, "goldens/default.png"));
    expect(createHash("sha256").update(goldenA).digest("hex")).toBe(createHash("sha256").update(goldenB).digest("hex"));
    const header = find(a.pages[0].root, "Header")!;
    expect(header.geometry.width).toBe(342);
    expect(find(a.pages[0].root, "Inactive")).toBeUndefined();
    expect(find(a.pages[0].root, "Content / Grid")?.layout.mode).toBe("grid");
    expect(find(a.pages[0].root, "Avatar")?.image?.fit).toBe("crop");
    expect(find(a.pages[0].root, "Status / Online")?.position).toBe("absolute");
    expect(find(a.pages[0].root, "Action")?.autoMargin?.top).toBe(true);
    expect(a.compatibility.rasterLayers).toHaveLength(2);
    expect(a.compatibility.rasterLayers.every((layer) => !layer.assetKey.startsWith("pending:"))).toBe(true);
    expect(find(a.pages[0].root, "Effect / Presence Glow")?.kind).toBe("raster");
  }, 30_000);
});

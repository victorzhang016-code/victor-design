import { describe, expect, it } from "vitest";
import { calculateImportOrigin } from "../src/plugin/placement";

describe("Figma import placement", () => {
  it("centers a new import in the current viewport on an empty page", () => {
    expect(calculateImportOrigin([], { x: 1000, y: 700 }, 2040, 844)).toEqual({ x: -20, y: 278 });
  });

  it("stacks a new import below existing page content", () => {
    expect(calculateImportOrigin([{ x: 120, y: 80, width: 390, height: 844 }], { x: 0, y: 0 }, 2040, 844)).toEqual({ x: 120, y: 1084 });
  });
});

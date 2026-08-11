import { describe, expect, it } from "vitest";
import { inferAxisSizing, inferVisibility, matchedRuleDeclarations } from "../src/capture/inference";

describe("CSSOM inference", () => {
  it("does not let a descendant selector define the parent width", () => {
    const rules = [
      { selectorText: ".header .handmark", declarations: { width: "38px" } },
      { selectorText: ".header", declarations: { display: "flex" } }
    ];
    const matched = matchedRuleDeclarations(rules, ".header");
    expect(matched.width).toBeUndefined();
  });

  it("maps flex-grow to fill and content-sized inline-flex to hug", () => {
    expect(inferAxisSizing({ display: "flex", flexGrow: "1", width: "342px" }, "horizontal")).toBe("fill");
    expect(inferAxisSizing({ display: "inline-flex", flexGrow: "0", width: "76px" }, "horizontal")).toBe("hug");
  });

  it("excludes hidden and fully clipped inactive state nodes", () => {
    expect(inferVisibility({ display: "none", visibility: "visible", opacity: "1" }, { x: 0, y: 0, width: 10, height: 10 }, { x: 0, y: 0, width: 390, height: 844 })).toBe(false);
    expect(inferVisibility({ display: "block", visibility: "visible", opacity: "1" }, { x: 500, y: 0, width: 10, height: 10 }, { x: 0, y: 0, width: 390, height: 844 })).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { containerAxisSizing } from "../src/plugin/axis-sizing";

describe("auto-layout container axes", () => {
  it("keeps a flex:1 vertical center container fixed on its internal axes", () => {
    expect(containerAxisSizing("vertical", { horizontal: "fill", vertical: "fill" })).toEqual({ primary: "FIXED", counter: "FIXED" });
  });

  it("uses hug only when the corresponding browser axis is hug", () => {
    expect(containerAxisSizing("horizontal", { horizontal: "hug", vertical: "fixed" })).toEqual({ primary: "AUTO", counter: "FIXED" });
  });
});

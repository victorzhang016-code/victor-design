import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/cli";

describe("capture CLI arguments", () => {
  it("accepts strict as a boolean flag", () => {
    const options = parseArgs([
      "--input", "controlled-ui.html",
      "--output", "capture",
      "--strict"
    ]);

    expect(options.strict).toBe(true);
  });

  it("allows no-strict to opt out of the default", () => {
    const options = parseArgs([
      "--input", "controlled-ui.html",
      "--output", "capture",
      "--no-strict"
    ]);

    expect(options.strict).toBe(false);
  });
});

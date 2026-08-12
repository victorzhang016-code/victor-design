import { describe, expect, it } from "vitest";
import { detectPackageRoute } from "../src/plugin/legacy";

describe("compatibility routing", () => {
  it("routes schema v3 to the strict builder", () => expect(detectPackageRoute({ schemaVersion: 3, pages: [] })).toBe("v3"));
  it("routes tree packages to deprecated UI v2", () => expect(detectPackageRoute({ pages: [{ tree: {} }] })).toBe("ui-v2"));
  it("keeps flat poster packages on the legacy route", () => expect(detectPackageRoute({ pages: [{ nodes: [] }] })).toBe("flat"));
});

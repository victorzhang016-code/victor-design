import type { AxisSizing, Rect } from "../shared/schema";

export type RuleLike = { selectorText: string; declarations: Record<string, string | undefined> };

export function matchedRuleDeclarations(rules: RuleLike[], targetSelector: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rule of rules) {
    const selectors = rule.selectorText.split(",").map((value) => value.trim());
    if (selectors.includes(targetSelector.trim())) {
      for (const [key, value] of Object.entries(rule.declarations)) if (value !== undefined) out[key] = value;
    }
  }
  return out;
}

export type SizingStyle = {
  display?: string;
  flexGrow?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  position?: string;
};

export function inferAxisSizing(style: SizingStyle, axis: "horizontal" | "vertical", authoredValue?: string, annotation?: AxisSizing): AxisSizing {
  if (annotation) return annotation;
  if (style.position === "absolute" || style.position === "fixed") return "fixed";
  if ((Number.parseFloat(style.flexGrow || "0") || 0) > 0) return "fill";
  const display = style.display || "block";
  const value = authoredValue ?? "auto";
  if (display === "inline" || display === "inline-flex" || display === "inline-grid") return "hug";
  if (/^(auto|max-content|min-content|fit-content)/.test(value)) return "hug";
  if (/%|vw|vh|dvw|dvh|calc\(/.test(value)) return "fill";
  if (/^-?\d+(\.\d+)?px$/.test(value)) return "fixed";
  return axis === "vertical" ? "hug" : "fill";
}

export function intersectRect(a: Rect, b: Rect): Rect {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
}

export function inferVisibility(style: { display: string; visibility: string; opacity: string }, rect: Rect, clip: Rect): boolean {
  if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
  if ((Number.parseFloat(style.opacity) || 0) <= 0) return false;
  if (rect.width <= 0 || rect.height <= 0) return false;
  const visible = intersectRect(rect, clip);
  return visible.width > 0 && visible.height > 0;
}

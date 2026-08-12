import type { AxisSizing, IrLayout } from "../shared/schema";

/**
 * Figma exposes two sizing systems for an auto-layout frame. `layoutSizing*`
 * controls the frame in its parent; these values control the frame's *own*
 * axes. Keep a browser-sized Fill/Fixed flex container fixed internally so
 * justify-content:center has real free space to distribute.
 */
export function containerAxisSizing(
  mode: IrLayout["mode"],
  sizing: { horizontal: AxisSizing; vertical: AxisSizing }
): { primary: "AUTO" | "FIXED"; counter: "AUTO" | "FIXED" } {
  const primary = mode === "horizontal" ? sizing.horizontal : sizing.vertical;
  const counter = mode === "horizontal" ? sizing.vertical : sizing.horizontal;
  return {
    primary: primary === "hug" ? "AUTO" : "FIXED",
    counter: counter === "hug" ? "AUTO" : "FIXED"
  };
}

import { z } from "zod";

export const AxisSizingSchema = z.enum(["fixed", "hug", "fill"]);
export type AxisSizing = z.infer<typeof AxisSizingSchema>;

export const RectSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().nonnegative(),
  height: z.number().finite().nonnegative()
});
export type Rect = z.infer<typeof RectSchema>;

export const ColorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
  a: z.number().min(0).max(1).default(1)
});
export type IrColor = z.infer<typeof ColorSchema>;

export const CompatibilityItemSchema = z.object({
  code: z.string(),
  nodeId: z.string().optional(),
  message: z.string(),
  detail: z.string().optional()
});
export type CompatibilityItem = z.infer<typeof CompatibilityItemSchema>;

export const LayoutSchema = z.object({
  mode: z.enum(["none", "horizontal", "vertical", "grid"]),
  gap: z.number().finite().nonnegative().default(0),
  rowGap: z.number().finite().nonnegative().optional(),
  columnGap: z.number().finite().nonnegative().optional(),
  padding: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  justify: z.enum(["start", "center", "end", "space-between"]),
  align: z.enum(["start", "center", "end", "stretch", "baseline"]),
  wrap: z.boolean(),
  grid: z.object({
    columns: z.array(z.object({ kind: z.enum(["fixed", "fraction", "auto"]), value: z.number().positive().optional() })),
    rows: z.array(z.object({ kind: z.enum(["fixed", "fraction", "auto"]), value: z.number().positive().optional() })).optional()
  }).optional()
});
export type IrLayout = z.infer<typeof LayoutSchema>;

export const TextSchema = z.object({
  value: z.string(),
  family: z.string(),
  weight: z.number().int().min(1).max(1000),
  style: z.string(),
  size: z.number().positive(),
  lineHeight: z.number().positive().nullable(),
  letterSpacing: z.number(),
  align: z.enum(["left", "center", "right", "justified"]),
  color: ColorSchema,
  singleLine: z.boolean(),
  styleName: z.string().optional(),
  property: z.object({ name: z.string(), type: z.literal("text") }).optional()
});

export const StyleSchema = z.object({
  fills: z.array(z.object({ type: z.literal("solid"), color: ColorSchema })).default([]),
  opacity: z.number().min(0).max(1).default(1),
  radius: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  border: z.object({ color: ColorSchema, widths: z.tuple([z.number(), z.number(), z.number(), z.number()]) }).optional(),
  clipsContent: z.boolean().optional(),
  shadow: z.object({ x: z.number(), y: z.number(), blur: z.number().nonnegative(), spread: z.number(), color: ColorSchema }).optional()
});

export const IrNodeSchema = z.lazy(() => z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["frame", "text", "image", "shape", "vector", "raster"]),
  geometry: RectSchema,
  visibleBounds: RectSchema,
  layout: LayoutSchema,
  sizing: z.object({
    horizontal: AxisSizingSchema,
    vertical: AxisSizingSchema,
    grow: z.number().finite().nonnegative(),
    minWidth: z.number().nonnegative().optional(),
    maxWidth: z.number().nonnegative().optional(),
    minHeight: z.number().nonnegative().optional(),
    maxHeight: z.number().nonnegative().optional()
  }),
  position: z.enum(["flow", "absolute"]).default("flow"),
  absolute: z.object({ x: z.number(), y: z.number() }).optional(),
  autoMargin: z.object({ top: z.boolean(), right: z.boolean(), bottom: z.boolean(), left: z.boolean() }).optional(),
  margins: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  alignSelf: z.enum(["auto", "start", "center", "end", "stretch"]).optional(),
  style: StyleSchema,
  text: TextSchema.optional(),
  image: z.object({ assetKey: z.string(), fit: z.enum(["fill", "fit", "crop", "tile"]), alt: z.string().optional() }).optional(),
  vector: z.object({ svg: z.string() }).optional(),
  raster: z.object({ assetKey: z.string(), reason: z.string() }).optional(),
  component: z.object({ name: z.string(), explicit: z.boolean() }).optional(),
  variableBindings: z.record(z.string()).optional(),
  source: z.object({ tag: z.string(), selector: z.string(), htmlId: z.string().optional() }).optional(),
  compatibility: z.array(CompatibilityItemSchema).optional(),
  children: z.array(IrNodeSchema)
})) as unknown as z.ZodType<IrNode>;

export interface IrNode {
  id: string;
  name: string;
  kind: "frame" | "text" | "image" | "shape" | "vector" | "raster";
  geometry: Rect;
  visibleBounds: Rect;
  layout: IrLayout;
  sizing: {
    horizontal: AxisSizing;
    vertical: AxisSizing;
    grow: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
  position?: "flow" | "absolute";
  absolute?: { x: number; y: number };
  autoMargin?: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  margins?: [number, number, number, number];
  alignSelf?: "auto" | "start" | "center" | "end" | "stretch";
  style: z.infer<typeof StyleSchema>;
  text?: z.infer<typeof TextSchema>;
  image?: { assetKey: string; fit: "fill" | "fit" | "crop" | "tile"; alt?: string };
  vector?: { svg: string };
  raster?: { assetKey: string; reason: string };
  component?: { name: string; explicit: boolean };
  variableBindings?: Record<string, string>;
  source?: { tag: string; selector: string; htmlId?: string };
  compatibility?: CompatibilityItem[];
  children: IrNode[];
}

export const DomMigratePackageV3Schema = z.object({
  schemaVersion: z.literal(3),
  generator: z.object({ name: z.string(), version: z.string() }),
  capturedAt: z.string(),
  source: z.object({ url: z.string(), viewport: z.object({ width: z.number().positive(), height: z.number().positive() }) }).optional(),
  pages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    viewport: z.object({ width: z.number().positive(), height: z.number().positive() }),
    golden: z.string().optional(),
    root: IrNodeSchema
  })).min(1),
  images: z.record(z.string()),
  variables: z.object({
    colors: z.record(ColorSchema).default({}),
    spacing: z.record(z.number()).default({}),
    radius: z.record(z.number()).default({})
  }).optional(),
  textStyles: z.record(TextSchema.omit({ value: true, property: true })).optional(),
  compatibility: z.object({
    warnings: z.array(CompatibilityItemSchema),
    errors: z.array(CompatibilityItemSchema),
    fonts: z.array(z.object({ family: z.string(), weight: z.number(), style: z.string(), nodes: z.array(z.string()) })),
    rasterLayers: z.array(z.object({ nodeId: z.string(), reason: z.string(), assetKey: z.string() }))
  })
});
export type DomMigratePackageV3 = z.infer<typeof DomMigratePackageV3Schema>;

export function parseDomMigratePackage(input: unknown): DomMigratePackageV3 {
  return DomMigratePackageV3Schema.parse(input);
}

export type PlacementRect = { x: number; y: number; width: number; height: number };
export type PlacementPoint = { x: number; y: number };

/**
 * Place a new import in the current canvas view when the target page is empty;
 * otherwise stack it below the existing page content with a deliberate gap.
 */
export function calculateImportOrigin(existing: PlacementRect[], viewportCenter: PlacementPoint, importedWidth: number, importedHeight: number, gap = 160): PlacementPoint {
  if (!existing.length) return { x: viewportCenter.x - importedWidth / 2, y: viewportCenter.y - importedHeight / 2 };
  const minX = Math.min(...existing.map((rect) => rect.x));
  const maxY = Math.max(...existing.map((rect) => rect.y + rect.height));
  return { x: minX, y: maxY + gap };
}

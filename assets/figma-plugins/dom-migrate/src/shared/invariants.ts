import type { CompatibilityItem, DomMigratePackageV3, IrNode } from "./schema";

export type ValidationResult = { errors: CompatibilityItem[]; warnings: CompatibilityItem[] };

export function validateIr(pkg: DomMigratePackageV3): ValidationResult {
  const errors: CompatibilityItem[] = [];
  const warnings: CompatibilityItem[] = [];

  const walk = (node: IrNode, path: string) => {
    const nodePath = `${path}/${node.name}`;
    if (/^spacer(?:-grow)?$/i.test(node.name)) {
      errors.push({ code: "PIXEL_SPACER", nodeId: node.id, message: `Anonymous pixel spacer is forbidden at ${nodePath}` });
    }
    const axisChecks: Array<["horizontal" | "vertical", boolean]> = [
      ["horizontal", node.layout.mode === "horizontal" || node.layout.align === "stretch"],
      ["vertical", node.layout.mode === "vertical"]
    ];
    for (const [axis, participates] of axisChecks) {
      if (!participates || node.sizing[axis] !== "hug") continue;
      const conflict = node.children.find((child) => child.position !== "absolute" && (child.sizing[axis] === "fill" || child.sizing.grow > 0));
      if (conflict) {
        errors.push({
          code: "HUG_FILL_CONFLICT",
          nodeId: conflict.id,
          message: `${nodePath} hugs ${axis} while ${conflict.name} fills/grows on the same axis`
        });
      }
    }
    const names = new Set<string>();
    for (const child of node.children) {
      if (names.has(child.name)) warnings.push({ code: "DUPLICATE_SIBLING_NAME", nodeId: child.id, message: `Duplicate sibling name ${child.name} at ${nodePath}` });
      names.add(child.name);
      walk(child, nodePath);
    }
  };
  for (const page of pkg.pages) walk(page.root, page.name);
  return { errors, warnings };
}

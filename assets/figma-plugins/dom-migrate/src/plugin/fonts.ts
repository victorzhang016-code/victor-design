import type { CompatibilityItem, DomMigratePackageV3 } from "../shared/schema";

export type AvailableFont = { fontName: FontName };
export type FontResolution = { map: Map<string, FontName>; errors: CompatibilityItem[]; warnings: CompatibilityItem[] };

const WEIGHT_WORDS: Array<[RegExp, number]> = [
  [/thin|hairline/i, 100],
  [/extra\s*light|ultra\s*light/i, 200],
  [/light/i, 300],
  [/regular|normal|book|roman/i, 400],
  [/medium/i, 500],
  [/semi\s*bold|demi\s*bold/i, 600],
  [/extra\s*bold|ultra\s*bold/i, 800],
  [/black|heavy/i, 900],
  [/bold/i, 700]
];

export function fontStyleWeight(style: string): number {
  for (const [pattern, weight] of WEIGHT_WORDS) if (pattern.test(style)) return weight;
  return 400;
}

function key(family: string, weight: number, style: string): string {
  return `${family}|${weight}|${style}`;
}

export function resolveFontRequirements(requirements: DomMigratePackageV3["compatibility"]["fonts"], available: AvailableFont[]): FontResolution {
  const map = new Map<string, FontName>();
  const errors: CompatibilityItem[] = [];
  const warnings: CompatibilityItem[] = [];
  const globalFallback = available.find((item) => item.fontName.family === "Inter" && item.fontName.style === "Regular")?.fontName || available[0]?.fontName;
  for (const requirement of requirements) {
    const familyFonts = available.filter((item) => item.fontName.family.toLowerCase() === requirement.family.toLowerCase());
    if (!familyFonts.length) {
      if (globalFallback) {
        map.set(key(requirement.family, requirement.weight, requirement.style), globalFallback);
        warnings.push({ code: "FONT_FAMILY_FALLBACK", message: `${requirement.family} is not available; mapped to ${globalFallback.family} ${globalFallback.style}`, detail: "Fallback keeps the import buildable; text metrics may differ" });
      } else {
        errors.push({ code: "FONT_UNAVAILABLE", message: `No loadable fonts are available in Figma for ${requirement.family}`, detail: requirement.nodes.join(", ") });
      }
      continue;
    }
    const italic = /italic|oblique/i.test(requirement.style);
    const exact = familyFonts.find((item) => fontStyleWeight(item.fontName.style) === requirement.weight && /italic|oblique/i.test(item.fontName.style) === italic);
    if (exact) {
      map.set(key(requirement.family, requirement.weight, requirement.style), exact.fontName);
      continue;
    }

    // Browsers resolve a requested numeric weight to the nearest face when a
    // family does not ship that exact face. Preserve the family and italic
    // axis, then keep the import buildable with the nearest same-family face;
    // a cross-family fallback is used only when the family is absent.
    const candidates = familyFonts
      .filter((item) => /italic|oblique/i.test(item.fontName.style) === italic)
      .map((item) => ({ item, weight: fontStyleWeight(item.fontName.style) }))
      .sort((a, b) => {
        const distance = Math.abs(a.weight - requirement.weight) - Math.abs(b.weight - requirement.weight);
        if (distance !== 0) return distance;
        return requirement.weight >= 600 ? b.weight - a.weight : a.weight - b.weight;
      });
    const aliased = candidates[0] || familyFonts.map((item) => ({ item, weight: fontStyleWeight(item.fontName.style) })).sort((a, b) => Math.abs(a.weight - requirement.weight) - Math.abs(b.weight - requirement.weight))[0];
    if (aliased) {
      map.set(key(requirement.family, requirement.weight, requirement.style), aliased.item.fontName);
      warnings.push({
        code: "FONT_WEIGHT_FALLBACK",
        message: `${requirement.family} weight ${requirement.weight} mapped to native ${aliased.item.fontName.style} (${aliased.weight})`,
        detail: "Same-family fallback; no cross-family substitution"
      });
      continue;
    }
    if (globalFallback) {
      map.set(key(requirement.family, requirement.weight, requirement.style), globalFallback);
      warnings.push({ code: "FONT_FALLBACK", message: `${requirement.family} weight ${requirement.weight} mapped to ${globalFallback.family} ${globalFallback.style}`, detail: "No compatible face was available" });
    } else {
      errors.push({ code: "FONT_UNAVAILABLE", message: `No loadable fonts are available in Figma for ${requirement.family}`, detail: requirement.nodes.join(", ") });
    }
  }
  return { map, errors, warnings };
}

export function fontRequirementKey(family: string, weight: number, style: string): string {
  return key(family, weight, style);
}

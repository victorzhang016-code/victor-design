import type { CompatibilityItem, DomMigratePackageV3 } from "../shared/schema";

export type AvailableFont = { fontName: FontName };
export type FontResolution = { map: Map<string, FontName>; errors: CompatibilityItem[] };

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
  for (const requirement of requirements) {
    const familyFonts = available.filter((item) => item.fontName.family.toLowerCase() === requirement.family.toLowerCase());
    if (!familyFonts.length) {
      errors.push({ code: "FONT_FAMILY_MISSING", message: `Font family ${requirement.family} is not available in Figma`, detail: requirement.nodes.join(", ") });
      continue;
    }
    const italic = /italic|oblique/i.test(requirement.style);
    const exact = familyFonts.find((item) => fontStyleWeight(item.fontName.style) === requirement.weight && /italic|oblique/i.test(item.fontName.style) === italic);
    if (!exact) {
      errors.push({ code: "FONT_WEIGHT_MISSING", message: `${requirement.family} weight ${requirement.weight}${italic ? " italic" : ""} is not available in Figma`, detail: familyFonts.map((item) => item.fontName.style).join(", ") });
      continue;
    }
    map.set(key(requirement.family, requirement.weight, requirement.style), exact.fontName);
  }
  return { map, errors };
}

export function fontRequirementKey(family: string, weight: number, style: string): string {
  return key(family, weight, style);
}

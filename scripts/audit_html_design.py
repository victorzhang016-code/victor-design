#!/usr/bin/env python3
"""Audit concrete HTML design declarations; never score visual taste."""

from __future__ import annotations

import argparse
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


VALID_ROLES = {"title", "explanation", "evidence", "action", "atmosphere"}
SUSPICIOUS_CLASS = re.compile(r"(?:meta|micro|kicker|badge|status|side-index|rail|rule|line|dot|connector)", re.I)
SMALL_PRINT = re.compile(r"font-size\s*:\s*(?:[0-9]|1[0-1](?:\.\d+)?)px", re.I)
VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}
STYLE_BLOCK = re.compile(r"<style[^>]*>(.*?)</style>", re.I | re.S)
CSS_COMMENT = re.compile(r"/\*.*?\*/", re.S)
URL_CONTENT = re.compile(r"url\([^)]*\)", re.I)
CSS_RULE = re.compile(r"([^{}]+)\{([^{}]*)\}")
FONT_SIZE_DECL = re.compile(r"font-size\s*:\s*([^;!]+)", re.I)
POSITION_DECL = re.compile(r"position\s*:\s*(?:absolute|fixed)", re.I)
CLIP_PATH_POLYGON = re.compile(r"clip-path\s*:\s*polygon\(\s*([^)]*)\)", re.I)
BACKGROUND_IMAGE = re.compile(r"background(?:-image)?\s*:[^;]*(?:url\(\)|var\()", re.I)
VAR_DECL = re.compile(r"(--[\w-]+)\s*:\s*([^;]+)")
VAR_REF = re.compile(r"var\((--[\w-]+)\)")
PX_LENGTH = re.compile(r"(\d+(?:\.\d+)?)px")
MIN_TEXT_LEVELS = 5
MIN_TEXT_ANCHORS = 4


class Check(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.viewport = False
        self.image_count = 0
        self.roles: set[str] = set()
        self.layers: set[str] = set()
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.schema = ""
        self.actions: set[str] = set()
        self.stack: list[dict] = []
        self.roots: list[dict] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key.lower(): value or "" for key, value in attrs}
        if data.get("data-vds-schema"):
            self.schema = data["data-vds-schema"].strip().lower()
        if tag == "meta" and data.get("name", "").lower() == "viewport":
            self.viewport = True
        if tag == "img":
            self.image_count += 1
            if "alt" not in data:
                self.errors.append("image lacks alt text")
            if data.get("alt") and data.get("data-vds-role") not in VALID_ROLES:
                self.errors.append("meaningful image lacks a valid data-vds-role")
        role = data.get("data-vds-role")
        if role and role not in VALID_ROLES:
            self.errors.append(f"invalid data-vds-role: {role}")
        if role in VALID_ROLES:
            self.roles.add(role)
        layer = data.get("data-vds-layer", "")
        if layer:
            normalized = re.sub(r"[_\s]+", "-", layer.strip().lower())
            self.layers.add(normalized)
        action = data.get("data-vds-action", "")
        if action:
            self.actions.update(
                item for item in re.split(r"[\s,]+", action.strip().lower()) if item
            )
        classes = data.get("class", "")
        if SUSPICIOUS_CLASS.search(classes):
            if not (role in VALID_ROLES or data.get("data-vds-cause")):
                self.errors.append(f"suspicious class '{classes}' lacks data-vds-role or data-vds-cause")
        if tag in {"hr"} and not data.get("data-vds-cause"):
            self.errors.append("rule lacks data-vds-cause")
        style = data.get("style", "")
        if SMALL_PRINT.search(style):
            self.warnings.append("inline small print needs a source-role review")
        if "writing-mode" in style.lower():
            self.warnings.append("vertical text needs a source-role review")
        node = {
            "tag": tag,
            "classes": set(classes.split()),
            "id": data.get("id", ""),
            "style": style,
            "text": False,
            "children": [],
            "anchor": None,
        }
        if self.stack:
            self.stack[-1]["children"].append(node)
        else:
            self.roots.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]["tag"] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data: str) -> None:
        if not data.strip():
            return
        if self.stack and self.stack[-1]["tag"] in {"style", "script"}:
            return
        for node in self.stack:
            node["text"] = True


def css_rules(css: str) -> list[tuple[list[str], str]]:
    """Split style text into (selectors, declaration block); skip at-rules and url() payloads."""
    css = CSS_COMMENT.sub("", css)
    css = URL_CONTENT.sub("url()", css)
    rules: list[tuple[list[str], str]] = []
    for match in CSS_RULE.finditer(css):
        selector = match.group(1).strip()
        if not selector or selector.startswith("@"):
            continue
        selectors = [part.strip() for part in selector.split(",") if part.strip()]
        if selectors:
            rules.append((selectors, match.group(2)))
    return rules


def compound_key(selector: str) -> tuple[str | None, frozenset[str], str | None] | None:
    """Reduce a selector to its rightmost compound: (tag, classes, id)."""
    compound = re.split(r"[\s>+~]+", selector.strip())[-1]
    compound = re.sub(r"\[[^\]]*\]", "", compound)
    compound = re.sub(r"::?[a-zA-Z-]+(?:\([^)]*\))?", "", compound)
    if not compound:
        return None
    tag = re.match(r"[a-zA-Z][\w-]*", compound)
    classes = frozenset(re.findall(r"\.([\w-]+)", compound))
    ident = re.search(r"#([\w-]+)", compound)
    if tag is None and not classes and ident is None:
        return None
    return (
        tag.group(0).lower() if tag else None,
        classes,
        ident.group(1).lower() if ident else None,
    )


def node_matches(node: dict, key: tuple[str | None, frozenset[str], str | None]) -> bool:
    tag, classes, ident = key
    if tag and node["tag"] != tag:
        return False
    if not classes <= node["classes"]:
        return False
    if ident and node["id"].lower() != ident:
        return False
    return True


def declarations(block: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for item in block.split(";"):
        if ":" in item:
            name, value = item.split(":", 1)
            result[name.strip().lower()] = value.strip()
    return result


def resolve_px(value: str, variables: dict[str, str]) -> float | None:
    value = value.strip()
    ref = VAR_REF.fullmatch(value)
    if ref:
        value = variables.get(ref.group(1), "").strip()
    match = PX_LENGTH.fullmatch(value)
    return float(match.group(1)) if match else None


def canvas_size(rules: list, variables: dict[str, str]) -> tuple[float, float] | None:
    fallback: tuple[float, float] | None = None
    fallback_area = 0.0
    for selectors, block, _keys in rules:
        decl = declarations(block)
        width = resolve_px(decl.get("width", ""), variables)
        height = resolve_px(decl.get("height", ""), variables)
        if not (width and height):
            continue
        if any(selector in {"html", "body"} for selector in selectors):
            return (width, height)
        if width * height > fallback_area:
            fallback_area, fallback = width * height, (width, height)
    return fallback


def polygon_points(spec: str, width: float, height: float) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for pair in spec.split(","):
        parts = pair.split()
        if len(parts) != 2:
            return []
        coords: list[float] = []
        for value, size in zip(parts, (width, height)):
            if value.endswith("%"):
                coords.append(float(value[:-1]) / 100)
            elif value.endswith("px"):
                coords.append(float(value[:-2]) / size)
            else:
                number = float(value)
                coords.append(number if number <= 1 else number / size)
        points.append((coords[0], coords[1]))
    return points


def floating_polygon_warnings(rules: list, variables: dict[str, str], parser: Check) -> list[str]:
    """Warn when a main image is clipped by a polygon touching no canvas edge."""
    canvas = canvas_size(rules, variables)
    if canvas is None:
        return []
    width, height = canvas
    area_floor = 0.6 * width * height
    warnings: list[str] = []

    def visit(node: dict) -> None:
        blocks = [
            block
            for _selectors, block, keys in rules
            if any(key and node_matches(node, key) for key in keys)
        ]
        is_image = node["tag"] == "img" or any(BACKGROUND_IMAGE.search(block) for block in blocks)
        clip = CLIP_PATH_POLYGON.search(node["style"])
        if clip is None:
            for block in blocks:
                clip = CLIP_PATH_POLYGON.search(block)
                if clip:
                    break
        if is_image and clip:
            merged: dict[str, str] = {}
            for block in blocks:
                merged.update(declarations(block))
            merged.update(declarations(node["style"]))
            area_width = resolve_px(merged.get("width", ""), variables)
            area_height = resolve_px(merged.get("height", ""), variables)
            if area_width and area_height:
                area = area_width * area_height
            elif "inset" in merged or (
                merged.get("width") == "100%" and merged.get("height") == "100%"
            ):
                area = width * height
            else:
                area = None
            if area is not None and area >= area_floor:
                points = polygon_points(clip.group(1), width, height)
                if points:
                    touches_edge = any(
                        x <= 0.01 or x >= 0.99 or y <= 0.01 or y >= 0.99
                        for x, y in points
                    )
                    if not touches_edge:
                        label = ".".join(sorted(node["classes"])) or node["tag"]
                        warnings.append(
                            f"floating polygon window: image '{label}' is clipped by a polygon that touches no canvas edge"
                        )
        for child in node["children"]:
            visit(child)

    for root in parser.roots:
        visit(root)
    return warnings


def poster_structure(text: str, parser: Check) -> tuple[list[str], list[str]]:
    """Count observable text levels, text anchors, and floating polygon windows."""
    errors: list[str] = []
    warnings: list[str] = []
    blocks = STYLE_BLOCK.findall(text)
    if not blocks:
        return errors, warnings
    try:
        rules = [
            (selectors, block, [compound_key(selector) for selector in selectors])
            for selectors, block in css_rules("\n".join(blocks))
        ]
        variables: dict[str, str] = {}
        for selectors, block, _keys in rules:
            if ":root" in selectors:
                variables.update(
                    (name, value.strip()) for name, value in VAR_DECL.findall(block)
                )
        levels = {
            re.sub(r"\s+", "", value.lower())
            for _selectors, block, _keys in rules
            for value in FONT_SIZE_DECL.findall(block)
        }
        if len(levels) < MIN_TEXT_LEVELS:
            errors.append(
                f"single-image poster has only {len(levels)} observable text levels; "
                f"at least {MIN_TEXT_LEVELS} distinct font-size levels expected"
            )
        positioned = [
            (selector, key)
            for selectors, block, keys in rules
            if POSITION_DECL.search(block)
            for selector, key in zip(selectors, keys)
            if key
        ]

        def anchor_key(node: dict) -> str | None:
            if not node["text"]:
                return None
            hits = [selector for selector, key in positioned if node_matches(node, key)]
            if hits:
                return "css:" + max(hits, key=len)
            if POSITION_DECL.search(node["style"]):
                return f"inline:{node['tag']}:{' '.join(sorted(node['classes']))}"
            return None

        def assign(node: dict) -> None:
            node["anchor"] = anchor_key(node)
            for child in node["children"]:
                assign(child)

        def anchored_descendant(node: dict) -> bool:
            return any(
                child["anchor"] or anchored_descendant(child) for child in node["children"]
            )

        anchors: set[str] = set()

        def collect(node: dict) -> None:
            if node["anchor"] and not anchored_descendant(node):
                anchors.add(node["anchor"])
            for child in node["children"]:
                collect(child)

        for root in parser.roots:
            assign(root)
        for root in parser.roots:
            collect(root)
        if len(anchors) < MIN_TEXT_ANCHORS:
            errors.append(
                f"single-image poster has only {len(anchors)} positioned text anchors; "
                f"at least {MIN_TEXT_ANCHORS} expected"
            )
        warnings.extend(floating_polygon_warnings(rules, variables, parser))
    except Exception:
        return [], ["poster CSS could not be parsed; observable structure checks skipped"]
    return errors, warnings


def audit(path: Path, single_image_poster: bool = False) -> tuple[list[str], list[str]]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    parser = Check()
    parser.feed(text)
    errors = list(parser.errors)
    warnings = list(parser.warnings)
    if not parser.viewport:
        errors.append("missing responsive viewport meta tag")
    if re.search(r"outline\s*:\s*(?:none|0)", text) and not re.search(r":focus(?:-visible)?", text):
        errors.append("focus outline removed without a visible replacement")
    if SMALL_PRINT.search(text) and not parser.warnings:
        warnings.append("small print exists; inspect its source role")
    if re.search(r"writing-mode\s*:\s*vertical", text, re.I) and not parser.warnings:
        warnings.append("vertical text exists; inspect its source role")
    if parser.schema in {"v3.1", "3.1"} and len(parser.actions) < 4:
        errors.append(
            "v3.1 high-fidelity artifact declares fewer than four concrete design actions"
        )
    if single_image_poster:
        required_roles = {"title", "explanation", "evidence"}
        missing_roles = sorted(required_roles - parser.roles)
        if missing_roles:
            errors.append(
                "single-image poster lacks content roles: " + ", ".join(missing_roles)
            )
        required_layers = {"field", "event", "inscription"}
        if not (parser.layers & {"material", "furniture"}):
            errors.append("single-image poster lacks a caused material or furniture layer")
        missing_layers = sorted(required_layers - parser.layers)
        if missing_layers:
            errors.append(
                "single-image poster lacks authored layers: " + ", ".join(missing_layers)
            )
        if parser.image_count and parser.roles <= {"title", "evidence"}:
            errors.append("single-image poster is an image-plus-title composition")
        structure_errors, structure_warnings = poster_structure(text, parser)
        errors.extend(structure_errors)
        warnings.extend(structure_warnings)
    return errors, warnings


def main() -> int:
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("files", nargs="+", type=Path)
    cli.add_argument("--strict", action="store_true", help="treat warnings as failures")
    cli.add_argument(
        "--single-image-poster",
        action="store_true",
        help="enforce the authored-layer and observable-structure floor for one-image poster inputs",
    )
    args = cli.parse_args()
    errors: list[str] = []
    warnings: list[str] = []
    for path in args.files:
        if not path.is_file():
            errors.append(f"{path}: missing file")
            continue
        found_errors, found_warnings = audit(path, args.single_image_poster)
        errors.extend(f"{path}: {item}" for item in found_errors)
        warnings.extend(f"{path}: {item}" for item in found_warnings)
    if errors or (args.strict and warnings):
        print("HTML DESIGN AUDIT: FAIL")
        for item in errors + (warnings if args.strict else []):
            print(f"- {item}")
        return 1
    print("HTML DESIGN AUDIT: PASS")
    for item in warnings:
        print(f"- REVIEW: {item}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

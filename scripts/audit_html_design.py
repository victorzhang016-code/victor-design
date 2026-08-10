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


class Check(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.viewport = False
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key.lower(): value or "" for key, value in attrs}
        if tag == "meta" and data.get("name", "").lower() == "viewport":
            self.viewport = True
        if tag == "img":
            if "alt" not in data:
                self.errors.append("image lacks alt text")
            if data.get("alt") and data.get("data-vds-role") not in VALID_ROLES:
                self.errors.append("meaningful image lacks a valid data-vds-role")
        role = data.get("data-vds-role")
        if role and role not in VALID_ROLES:
            self.errors.append(f"invalid data-vds-role: {role}")
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


def audit(path: Path) -> tuple[list[str], list[str]]:
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
    return errors, warnings


def main() -> int:
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("files", nargs="+", type=Path)
    cli.add_argument("--strict", action="store_true", help="treat warnings as failures")
    args = cli.parse_args()
    errors: list[str] = []
    warnings: list[str] = []
    for path in args.files:
        if not path.is_file():
            errors.append(f"{path}: missing file")
            continue
        found_errors, found_warnings = audit(path)
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

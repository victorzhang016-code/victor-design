#!/usr/bin/env python3
"""Validate Victor Design System execution evidence, not visual taste."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


GATE_HEADINGS = {
    "1": "Proposition",
    "2": "Master",
    "3": "Delivery",
}
BASE_FIELDS = {
    "1": (
        "Decision", "User approval", "Approval evidence", "Source route",
        "Source policy", "Contact sheet", "Asset ledger", "Hero source",
        "Generation exception",
    ),
    "2": (
        "Decision", "HTML master", "Approved render", "User approval",
        "Approval evidence", "Visual review",
    ),
    "3": ("Decision",),
}
UNAPPROVED = re.compile(r"\b(?:pending|inferred|self[- ]?approved|not requested|n/?a|tbd)\b", re.I)
GENERATED = re.compile(r"\b(?:generated|imagegen|ai image|gpt-image)\b", re.I)
EXPLICIT_APPROVAL = re.compile(r"\b(?:explicit|user[- ]?approved|approved by victor|victor approved)\b", re.I)
FIGMA_URL = re.compile(r"https://(?:www\.)?figma\.com/(?:design|file)/", re.I)


def sections(text: str) -> dict[str, dict[str, str]]:
    result: dict[str, dict[str, str]] = {}
    matches = list(re.finditer(r"^## Gate ([123])\s*[—-]\s*[^\n]+$", text, re.M))
    for index, match in enumerate(matches):
        gate = match.group(1)
        body = text[match.end(): matches[index + 1].start() if index + 1 < len(matches) else len(text)]
        fields: dict[str, str] = {}
        for line in body.splitlines():
            field = re.match(r"^([A-Za-z][A-Za-z /-]+):\s*(.*?)\s*$", line.strip())
            if field:
                fields[field.group(1).lower()] = field.group(2)
        result[gate] = fields
    return result


def field_value(gate: dict[str, str], label: str) -> str:
    return gate.get(label.lower(), "")


def require(errors: list[str], gate_id: str, gate: dict[str, str], label: str) -> None:
    value = field_value(gate, label)
    if not value:
        errors.append(f"Gate {gate_id}: missing '{label}:'")


def explicit(errors: list[str], gate_id: str, gate: dict[str, str]) -> None:
    approval = field_value(gate, "User approval")
    evidence = field_value(gate, "Approval evidence")
    if not approval or UNAPPROVED.search(approval):
        errors.append(f"Gate {gate_id}: user approval is absent, pending, inferred, or self-approved")
    if not evidence or UNAPPROVED.search(evidence):
        errors.append(f"Gate {gate_id}: approval evidence must identify the user's explicit approval")


def local_reference_exists(root: Path, value: str) -> bool:
    if value.startswith(("http://", "https://")):
        return True
    return (root / value).is_file() or Path(value).is_file()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("delivery_dir", type=Path)
    surface = parser.add_mutually_exclusive_group()
    surface.add_argument("--poster", action="store_true")
    surface.add_argument("--product", action="store_true")
    parser.add_argument("--figma-required", action="store_true")
    parser.add_argument("--revision-led", action="store_true")
    parser.add_argument("--from-zero", action="store_true")
    args = parser.parse_args()

    root = args.delivery_dir
    control = root / "DESIGN_CONTROL.md"
    errors: list[str] = []
    if not control.is_file():
        errors.append("Missing DESIGN_CONTROL.md")
        text = ""
    else:
        text = control.read_text(encoding="utf-8")

    gates = sections(text)
    for gate_id, heading in GATE_HEADINGS.items():
        if gate_id not in gates:
            errors.append(f"Missing heading: ## Gate {gate_id} — {heading}")
            continue
        for label in BASE_FIELDS[gate_id]:
            require(errors, gate_id, gates[gate_id], label)

    if "1" in gates:
        explicit(errors, "1", gates["1"])
        ledger = field_value(gates["1"], "Asset ledger")
        if ledger and not local_reference_exists(root, ledger):
            errors.append(f"Gate 1: asset ledger does not exist: {ledger}")
        hero = field_value(gates["1"], "Hero source")
        exception = field_value(gates["1"], "Generation exception")
        if GENERATED.search(hero) and not EXPLICIT_APPROVAL.search(exception):
            errors.append("Gate 1: generated hero source lacks explicit user-approved exception")
        if not GENERATED.search(hero) and exception and not re.search(r"\b(?:not used|none|no)\b", exception, re.I):
            errors.append("Gate 1: generation exception must say not used or identify an explicit approval")

    if "2" in gates:
        explicit(errors, "2", gates["2"])
        if args.poster:
            for label in ("HTML master", "Approved render", "Visual review"):
                value = field_value(gates["2"], label)
                if value and not local_reference_exists(root, value):
                    errors.append(f"Gate 2: {label.lower()} does not exist: {value}")

    if args.figma_required:
        if "3" in gates:
            for label in ("Editable Figma file", "Primary frame/node", "Figma node audit", "Figma comparison"):
                require(errors, "3", gates["3"], label)
            figma = field_value(gates["3"], "Editable Figma file")
            if figma and not FIGMA_URL.search(figma):
                errors.append("Gate 3: editable Figma file must be a Figma Design/File URL")

    if args.revision_led and "1" in gates:
        require(errors, "1", gates["1"], "Reference comparison")
    if args.from_zero and "1" in gates:
        require(errors, "1", gates["1"], "Source policy")

    if errors:
        print("V3 EXECUTION GATE: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("V3 EXECUTION GATE: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())

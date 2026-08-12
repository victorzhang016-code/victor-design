#!/usr/bin/env python3
"""Validate Victor Design execution evidence, not visual taste."""

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
GATE1_STATE_FIELDS = (
    "Gate 1 status", "Image role status", "Image role", "Image placement",
    "Image role approval evidence", "Image role source/rights",
    "Brief status", "Direction status",
    "Direction preview shown", "Proposed direction", "Approved direction",
    "Brief approval evidence", "Direction approval evidence",
)
GATE_STATUS_VALUES = {"pending", "released"}
CHECKPOINT_VALUES = {"pending", "approved"}
IMAGE_ROLE_VALUES = {"base", "project-evidence", "supporting", "reference", "mixed", "pending"}
IMAGE_PLACEMENT_VALUES = {"background", "hero", "replaceable-image", "not-placed", "per-asset", "pending"}
DIR_ID = re.compile(r"^(?:none|[a-z0-9][a-z0-9._-]{0,31})$", re.I)
UNAPPROVED = re.compile(r"\b(?:pending|inferred|self[- ]?approved|not requested|n/?a|tbd)\b", re.I)
GENERATED = re.compile(r"\b(?:generated|imagegen|ai image|gpt-image)\b", re.I)
EXPLICIT_APPROVAL = re.compile(r"\b(?:explicit|user[- ]?approved|approved by victor|victor approved)\b", re.I)
FIGMA_URL = re.compile(r"https://(?:www\.)?figma\.com/(?:design|file)/", re.I)
MASTER_REVIEW = re.compile(r"master[ _-]?review", re.I)
BENCHMARK_HEADING = re.compile(
    r"^#{1,6}\s*(?:benchmark[ -]?comparison|基准对照|基准对比|对标对照)[^\n]*$", re.I | re.M
)
RENDER_REFERENCE = re.compile(r"[\w./\\-]+\.(?:png|jpe?g|webp|gif)", re.I)


def sections(text: str) -> dict[str, dict[str, str]]:
    result: dict[str, dict[str, str]] = {}
    matches = list(re.finditer(r"^## Gate ([123])\s*[—-]\s*[^\n]+$", text, re.M))
    for index, match in enumerate(matches):
        gate = match.group(1)
        body = text[match.end(): matches[index + 1].start() if index + 1 < len(matches) else len(text)]
        fields: dict[str, str] = {}
        for line in body.splitlines():
            field = re.match(r"^([A-Za-z][A-Za-z0-9 /-]+):\s*(.*?)\s*$", line.strip())
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


def validate_gate1_state(errors: list[str], gate: dict[str, str], root: Path, image_attached: bool) -> None:
    image_fields_present = any(field_value(gate, label) for label in GATE1_STATE_FIELDS)
    if not image_attached and not image_fields_present:
        return
    if image_attached:
        for label in GATE1_STATE_FIELDS:
            require(errors, "1", gate, label)
    gate_status = field_value(gate, "Gate 1 status").lower()
    image_role_status = field_value(gate, "Image role status").lower()
    image_role = field_value(gate, "Image role").lower()
    image_placement = field_value(gate, "Image placement").lower()
    image_evidence = field_value(gate, "Image role approval evidence")
    brief_status = field_value(gate, "Brief status").lower()
    direction_status = field_value(gate, "Direction status").lower()
    proposed = field_value(gate, "Proposed direction").lower()
    approved = field_value(gate, "Approved direction").lower()
    shown = field_value(gate, "Direction preview shown").lower()
    if gate_status not in GATE_STATUS_VALUES:
        errors.append("Gate 1: status must be pending or released")
    if image_role_status not in CHECKPOINT_VALUES:
        errors.append("Gate 1: image role status must be pending or approved")
    if image_role not in IMAGE_ROLE_VALUES:
        errors.append("Gate 1: image role must be base, project-evidence, supporting, reference, mixed, or pending")
    if image_placement not in IMAGE_PLACEMENT_VALUES:
        errors.append("Gate 1: image placement is invalid")
    if brief_status not in CHECKPOINT_VALUES:
        errors.append("Gate 1: brief status must be pending or approved")
    if direction_status not in CHECKPOINT_VALUES:
        errors.append("Gate 1: direction status must be pending or approved")
    if not DIR_ID.fullmatch(proposed):
        errors.append("Gate 1: proposed direction must be a stable ID or none")
    if not DIR_ID.fullmatch(approved):
        errors.append("Gate 1: approved direction must be a stable ID or none")
    if image_role_status == "approved":
        if image_role not in {"base", "project-evidence", "supporting", "reference", "mixed"}:
            errors.append("Gate 1: approved image role must be explicit")
        if not re.search(r"(?:user|victor|用户|回复|quote|消息)", image_evidence, re.I):
            errors.append("Gate 1: image role evidence must identify the user's reply")
    elif image_role != "pending" or image_placement != "pending":
        errors.append("Gate 1: pending image role must use pending role and placement")
    if image_role == "base" and image_placement not in {"background", "hero"}:
        errors.append("Gate 1: base image must be background or hero")
    if image_role in {"project-evidence", "supporting"} and image_placement not in {"replaceable-image", "not-placed"}:
        errors.append("Gate 1: material image cannot silently become background or hero")
    if image_role == "reference" and image_placement != "not-placed":
        errors.append("Gate 1: reference image must be not-placed by default")
    if image_role == "mixed" and image_placement != "per-asset":
        errors.append("Gate 1: mixed image roles must use per-asset placement and an asset ledger")
    if gate_status == "released":
        if image_role_status != "approved" or brief_status != "approved" or direction_status != "approved":
            errors.append("Gate 1: cannot release before image role, brief, and direction approval")
        if not shown.startswith("yes"):
            errors.append("Gate 1: released direction must record a shown preview")
        else:
            shown_path = re.sub(r"^yes\s*(?:—|-)\s*", "", shown, flags=re.I).strip()
            if not shown_path:
                errors.append("Gate 1: shown preview must include an artifact path or hash")
            elif not local_reference_exists(root, shown_path):
                errors.append(f"Gate 1: shown direction preview does not exist: {shown_path}")
        if approved == "none" or not DIR_ID.fullmatch(approved):
            errors.append("Gate 1: released direction must use a stable non-none ID")
        evidence = field_value(gate, "Direction approval evidence")
        if not re.search(r"(?:user|victor|用户|回复|quote|消息)", evidence, re.I):
            errors.append("Gate 1: direction evidence must identify the user's reply")
        if approved != "none" and DIR_ID.fullmatch(approved) and not re.search(
            rf"(?:select(?:ed)?|choose|选择|选|方向)\s*(?:direction\s*)?{re.escape(approved)}\b|\b{re.escape(approved)}\s*(?:方向|版)",
            evidence,
            re.I,
        ):
            errors.append(f"Gate 1: direction evidence does not select {approved}")
    elif direction_status == "approved" or approved != "none":
        errors.append("Gate 1: pending gate cannot contain an approved direction")


def local_reference_exists(root: Path, value: str) -> bool:
    if value.startswith(("http://", "https://")):
        return True
    return (root / value).is_file() or Path(value).is_file()


def validate_benchmark_comparison(errors: list[str], root: Path, review: str) -> None:
    if not review or review.startswith(("http://", "https://")):
        return
    path = root / review
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8", errors="ignore")
    if not (MASTER_REVIEW.search(review) or MASTER_REVIEW.search(text)):
        return
    heading = BENCHMARK_HEADING.search(text)
    if not heading:
        errors.append(f"Gate 2: master review lacks a benchmark-comparison section: {review}")
        return
    rest = text[heading.end():]
    following = re.search(r"^#{1,6}\s", rest, re.M)
    body = rest[: following.start()] if following else rest
    if not body.strip():
        errors.append(f"Gate 2: benchmark-comparison section is empty: {review}")
        return
    references = RENDER_REFERENCE.findall(body)
    if not references:
        errors.append(f"Gate 2: benchmark-comparison cites no render evidence path: {review}")
        return
    for reference in references:
        if not local_reference_exists(root, reference):
            errors.append(f"Gate 2: benchmark-comparison evidence does not exist: {reference}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("delivery_dir", type=Path)
    surface = parser.add_mutually_exclusive_group()
    surface.add_argument("--poster", action="store_true")
    surface.add_argument("--product", action="store_true")
    parser.add_argument("--figma-required", action="store_true")
    parser.add_argument("--revision-led", action="store_true")
    parser.add_argument("--from-zero", action="store_true")
    parser.add_argument("--gate1-only", action="store_true", help="validate only the Gate 1 checkpoint")
    parser.add_argument("--image-attached", action="store_true", help="require image-role preflight fields")
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
    gate_ids = {"1"} if args.gate1_only else set(GATE_HEADINGS)
    for gate_id, heading in GATE_HEADINGS.items():
        if gate_id not in gate_ids:
            continue
        if gate_id not in gates:
            errors.append(f"Missing heading: ## Gate {gate_id} — {heading}")
            continue
        for label in BASE_FIELDS[gate_id]:
            require(errors, gate_id, gates[gate_id], label)

    if "1" in gates:
        schema = field_value(gates["1"], "Design schema").lower()
        if schema in {"v3.1", "3.1"}:
            for label in (
                "Reference family", "Technique rationale", "Target density",
                "Revision contract", "Interpretive copy status",
            ):
                require(errors, "1", gates["1"], label)
        validate_gate1_state(errors, gates["1"], root, args.image_attached)
        if not args.gate1_only or field_value(gates["1"], "Gate 1 status").lower() == "released":
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

    if not args.gate1_only and "2" in gates:
        explicit(errors, "2", gates["2"])
        validate_benchmark_comparison(errors, root, field_value(gates["2"], "Visual review"))
        if args.poster:
            for label in ("HTML master", "Approved render", "Visual review"):
                value = field_value(gates["2"], label)
                if value and not local_reference_exists(root, value):
                    errors.append(f"Gate 2: {label.lower()} does not exist: {value}")

    if args.figma_required and not args.gate1_only:
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

    if args.gate1_only and (gates.get("2") or MASTER_REVIEW.search(text)):
        print("V3 EXECUTION GATE: FAIL")
        print(
            "- --gate1-only cannot pass a DESIGN_CONTROL that already records final "
            "master verification (Gate 2 fields or a MASTER_REVIEW reference are present); "
            "rerun without --gate1-only to validate the full delivery"
        )
        return 1

    print("V3 EXECUTION GATE: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())

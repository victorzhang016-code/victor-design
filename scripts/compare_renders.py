#!/usr/bin/env python3
"""Compare equal-size approved and translated renders without claiming taste."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageStat


def parse_region(value: str) -> tuple[str, tuple[int, int, int, int]]:
    try:
        name, coords = value.split(":", 1)
        box = tuple(int(part) for part in coords.split(","))
    except ValueError as error:
        raise argparse.ArgumentTypeError(
            "region must be NAME:X0,Y0,X1,Y1"
        ) from error
    if len(box) != 4 or box[2] <= box[0] or box[3] <= box[1]:
        raise argparse.ArgumentTypeError(
            "region must contain a positive box: NAME:X0,Y0,X1,Y1"
        )
    return name, box


def stats(reference: Image.Image, current: Image.Image) -> dict[str, list[float]]:
    difference = ImageChops.difference(reference, current)
    image_stat = ImageStat.Stat(difference)
    return {
        "mae": [round(value, 4) for value in image_stat.mean],
        "rms": [round(value, 4) for value in image_stat.rms],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("reference", type=Path)
    parser.add_argument("current", type=Path)
    parser.add_argument(
        "--region",
        action="append",
        default=[],
        type=parse_region,
        help="repeatable crop in NAME:X0,Y0,X1,Y1 form",
    )
    parser.add_argument("--output-diff", type=Path)
    parser.add_argument("--output-montage", type=Path)
    parser.add_argument(
        "--difference-gain",
        type=float,
        default=2.5,
        help="contrast multiplier for visual difference output",
    )
    parser.add_argument(
        "--max-mae",
        type=float,
        help="optional diagnostic threshold; fails when any channel exceeds it",
    )
    args = parser.parse_args()

    reference = Image.open(args.reference).convert("RGB")
    current = Image.open(args.current).convert("RGB")
    if reference.size != current.size:
        print(
            json.dumps(
                {
                    "status": "FAIL",
                    "reason": "size mismatch",
                    "reference_size": reference.size,
                    "current_size": current.size,
                },
                indent=2,
            )
        )
        return 2

    result: dict[str, object] = {
        "status": "PASS",
        "size": list(reference.size),
        "full": stats(reference, current),
        "regions": {},
    }
    region_results: dict[str, object] = {}
    for name, box in args.region:
        if (
            box[0] < 0
            or box[1] < 0
            or box[2] > reference.width
            or box[3] > reference.height
        ):
            parser.error(f"region '{name}' falls outside {reference.size}: {box}")
        region_results[name] = {
            "box": list(box),
            **stats(reference.crop(box), current.crop(box)),
        }
    result["regions"] = region_results

    difference = ImageChops.difference(reference, current)
    if args.output_diff:
        args.output_diff.parent.mkdir(parents=True, exist_ok=True)
        ImageEnhance.Contrast(difference).enhance(args.difference_gain).save(
            args.output_diff
        )

    if args.output_montage:
        montage = Image.new(
            "RGB",
            (reference.width * 3, reference.height),
            (0, 0, 0),
        )
        montage.paste(reference, (0, 0))
        montage.paste(current, (reference.width, 0))
        montage.paste(
            ImageEnhance.Contrast(difference).enhance(args.difference_gain),
            (reference.width * 2, 0),
        )
        args.output_montage.parent.mkdir(parents=True, exist_ok=True)
        montage.save(args.output_montage)

    if args.max_mae is not None:
        measured = [max(result["full"]["mae"])]
        measured.extend(
            max(region["mae"]) for region in region_results.values()
        )
        if max(measured) > args.max_mae:
            result["status"] = "FAIL"
            result["reason"] = (
                f"MAE threshold exceeded: {max(measured):.4f} > "
                f"{args.max_mae:.4f}"
            )

    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())

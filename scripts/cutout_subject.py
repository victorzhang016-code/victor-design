# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = [
#   "pillow>=10.4",
#   "rembg[cpu]>=2.0.67",
# ]
# ///
"""Create a source-faithful subject cutout.

Segmentation supplies alpha only. RGB pixels always come from the untouched
source image so the operation cannot silently repaint the photographed object.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps
from rembg import new_session, remove


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a transparent cutout while preserving source RGB pixels."
    )
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--model", default="isnet-general-use")
    parser.add_argument("--alpha-matting", action="store_true")
    parser.add_argument(
        "--crop-pad",
        type=int,
        default=-1,
        help="Crop to visible alpha with this many transparent pixels of padding; -1 keeps size.",
    )
    return parser.parse_args()


def crop_with_padding(image: Image.Image, padding: int) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError("Segmentation returned an empty alpha mask.")
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)
    return image.crop((left, top, right, bottom))


def main() -> None:
    args = parse_args()
    # Normalize camera/phone orientation before segmentation so source and mask
    # share the same pixel geometry.
    source = ImageOps.exif_transpose(Image.open(args.input)).convert("RGBA")
    session = new_session(args.model)
    segmented = remove(
        source,
        session=session,
        alpha_matting=args.alpha_matting,
        only_mask=False,
    ).convert("RGBA")
    if segmented.size != source.size:
        raise RuntimeError(
            f"Unexpected segmentation size {segmented.size}; source is {source.size}."
        )

    # Preserve the photographed object exactly: use segmentation only as alpha.
    result = source.copy()
    result.putalpha(segmented.getchannel("A"))
    if args.crop_pad >= 0:
        result = crop_with_padding(result, args.crop_pad)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.save(args.output)

    alpha = result.getchannel("A")
    visible_bbox = alpha.getbbox()
    extrema = alpha.getextrema()
    print(
        f"saved={args.output} size={result.size[0]}x{result.size[1]} "
        f"alpha_extrema={extrema} visible_bbox={visible_bbox} "
        "rgb_source=preserved"
    )


if __name__ == "__main__":
    main()

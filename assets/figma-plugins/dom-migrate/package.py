#!/usr/bin/env python3
"""dom-migrate packager: raw snapshot JSON -> Figma plugin package.

Usage:
  python package.py pages-raw.json --base <dir of the master html> -o figma-package.json

- Embeds referenced images (img src, CSS background images, page backgrounds)
  as base64, deduplicated by content.
- data-URI SVG backgrounds cannot be embedded as rasters directly; they are
  collected into <output>-svg-jobs.json. Rasterize each at its target size
  (e.g. a repeating band via headless Chrome) and rerun with
  --svg-png key=path.png to inject them.
"""

import argparse
import base64
import hashlib
import io
import json
import os
import urllib.parse

MAX_DIM = 4000  # Figma createImage rejects images beyond 4096px on a side


def load_capped(path):
    """Read an image file; downscale past Figma's createImage limit."""
    raw = open(path, "rb").read()
    try:
        from PIL import Image
    except ImportError:
        return raw
    im = Image.open(io.BytesIO(raw))
    if max(im.size) <= MAX_DIM:
        return raw
    im2 = im.copy()
    im2.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)
    buf = io.BytesIO()
    if im.mode in ("RGBA", "LA", "P"):
        im2.convert("RGBA").save(buf, "PNG")
    else:
        im2.convert("RGB").save(buf, "JPEG", quality=88)
    print(f"  downscaled >{MAX_DIM}px: {os.path.basename(path)} {im.size} -> {im2.size}")
    return buf.getvalue()
import re


def resolve(src, base):
    if src.startswith("file:///"):
        return urllib.parse.unquote(src[8:])
    return os.path.normpath(os.path.join(base, src))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("raw", help="raw snapshot JSON (array of pages)")
    ap.add_argument("--base", required=True, help="directory of the master HTML (for relative srcs)")
    ap.add_argument("-o", "--out", default="figma-package.json")
    ap.add_argument("--svg-png", action="append", default=[], help="key=path.png for rasterized svg jobs")
    args = ap.parse_args()

    pages = json.load(open(args.raw, encoding="utf-8"))
    svg_pngs = dict(kv.split("=", 1) for kv in args.svg_png)
    images = {}

    def intern(raw_bytes):
        b64 = base64.b64encode(raw_bytes).decode()
        h = hashlib.md5(b64.encode()).hexdigest()[:12]
        images.setdefault(h, b64)
        return h

    svg_jobs = []

    def embed_node(n):
        """resolve and intern an image/src-bearing node; returns nothing (mutates)."""
        src = n.pop("src", None)
        if src is None:
            return
        if src.startswith("data:image/svg"):
            svg = urllib.parse.unquote(src.split(",", 1)[1])
            key = f"svg-{len(svg_jobs)}"
            if key in svg_pngs:
                n["imageKey"] = intern(load_capped(svg_pngs[key]))
                n["type"] = "image"
                if n.get("kind"): n["kind"] = "image"
            else:
                svg_jobs.append({"key": key, "svg": svg, "w": n.get("w"), "h": n.get("h")})
                n["svgPending"] = key
            n.pop("repeat", None)
        else:
            n["imageKey"] = intern(load_capped(resolve(src, args.base)))
            if n.get("type") == "bgimage":
                n["type"] = "image"
                n.pop("repeat", None)

    def walk_tree(n):
        if not isinstance(n, dict):
            return
        if n.get("kind") == "image" or "src" in n:
            embed_node(n)
        if "bgImage" in n and isinstance(n["bgImage"], dict) and "src" in n["bgImage"]:
            bg = n.pop("bgImage")
            src = bg["src"]
            # CSS sprite-crop (background-size/position in px) -> pre-crop with PIL
            msize = re.match(r"^([\d.]+)px", bg.get("size") or "")
            mpos = re.match(r"^(-?[\d.]+)px\s+(-?[\d.]+)px", bg.get("pos") or "")
            if msize and mpos and n.get("size"):
                from PIL import Image
                path = resolve(src, args.base)
                im = Image.open(path).convert("RGBA")
                tw = float(msize.group(1))
                scale = tw / im.width
                im = im.resize((int(round(tw)), int(round(im.height * scale))))
                ox, oy = -float(mpos.group(1)), -float(mpos.group(2))
                box = (int(round(ox)), int(round(oy)),
                       int(round(ox + n["size"]["w"])), int(round(oy + n["size"]["h"])))
                crop = im.crop(box)
                import io as _io
                buf = _io.BytesIO(); crop.save(buf, "PNG")
                n["bgImageKey"] = intern(buf.getvalue())
            else:
                embed_node(bg)
                n["bgImageKey"] = bg.pop("imageKey", None)
        for c in n.get("children", []):
            walk_tree(c)

    for pg in pages:
        if "bgSrc" in pg:
            pg["bgImageKey"] = intern(load_capped(resolve(pg.pop("bgSrc"), args.base)))
        if pg.get("fxWarnings"):
            print(f"NOTE [{pg.get('name')}]: effect layers not captured by snapshot — pre-render alpha-PNG overlays "
                  f"(delivery-implementations.md > Effect layers): {'; '.join(pg['fxWarnings'])}")
        if "tree" in pg:
            walk_tree(pg["tree"])
            continue
        for n in pg["nodes"]:
            embed_node(n)

    pending = [j for j in svg_jobs]
    if pending:
        json.dump(svg_jobs, open(args.out.replace(".json", "-svg-jobs.json"), "w", encoding="utf-8"), ensure_ascii=False)
        print(f"WARNING: {len(pending)} svg background(s) need rasterizing -> see {args.out.replace('.json','-svg-jobs.json')}")
        print("rerun with --svg-png key=path.png after rasterizing.")

    json.dump({"pages": pages, "images": images}, open(args.out, "w", encoding="utf-8"), ensure_ascii=False)
    size_mb = os.path.getsize(args.out) / 1e6
    print(f"pages: {len(pages)}, unique images: {len(images)}, package: {size_mb:.1f} MB -> {args.out}")


if __name__ == "__main__":
    main()

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
import json
import os
import urllib.parse


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
    for pg in pages:
        if "bgSrc" in pg:
            pg["bgImageKey"] = intern(open(resolve(pg.pop("bgSrc"), args.base), "rb").read())
        for n in pg["nodes"]:
            src = n.pop("src", None)
            if src is None:
                continue
            if src.startswith("data:image/svg"):
                svg = urllib.parse.unquote(src.split(",", 1)[1])
                key = f"svg-{len(svg_jobs)}"
                if key in svg_pngs:
                    n["imageKey"] = intern(open(svg_pngs[key], "rb").read())
                    n["type"] = "image"
                else:
                    svg_jobs.append({"key": key, "svg": svg, "w": n["w"], "h": n["h"]})
                    n["svgPending"] = key
                n.pop("repeat", None)
            else:
                n["imageKey"] = intern(open(resolve(src, args.base), "rb").read())
                if n["type"] == "bgimage":
                    n["type"] = "image"
                    n.pop("repeat", None)

    pending = [n for pg in pages for n in pg["nodes"] if n.get("svgPending")]
    if pending:
        json.dump(svg_jobs, open(args.out.replace(".json", "-svg-jobs.json"), "w", encoding="utf-8"), ensure_ascii=False)
        print(f"WARNING: {len(pending)} svg background(s) need rasterizing -> see {args.out.replace('.json','-svg-jobs.json')}")
        print("rerun with --svg-png key=path.png after rasterizing.")

    json.dump({"pages": pages, "images": images}, open(args.out, "w", encoding="utf-8"), ensure_ascii=False)
    size_mb = os.path.getsize(args.out) / 1e6
    print(f"pages: {len(pages)}, unique images: {len(images)}, package: {size_mb:.1f} MB -> {args.out}")


if __name__ == "__main__":
    main()

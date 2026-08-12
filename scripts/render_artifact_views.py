#!/usr/bin/env python3
"""Plan and render VDS review views for posters, graphic-text, slides, and UI."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlencode


SURFACE_VIEWS = {
    "poster": [
        ("full", "full", "1440,2560"),
        ("thumbnail", "thumbnail", "360,640"),
        ("copy-hidden", "copy-hidden", "1440,2560"),
        ("image-hidden", "image-hidden", "1440,2560"),
        ("bottom", "bottom", "1440,360"),
    ],
    "graphic-text": [
        ("pages", "pages", "1080,1440"),
        ("contact-sheet", "contact-sheet", "1440,1080"),
        ("reading-sequence", "reading-sequence", "1440,1080"),
    ],
    "slides": [
        ("pages", "pages", "1920,1080"),
        ("contact-sheet", "contact-sheet", "1440,1080"),
        ("densest", "densest", "1920,1080"),
        ("bottom", "bottom", "1920,240"),
    ],
    "ui": [
        ("default", "default", "1440,1024"),
        ("long-copy", "long-copy", "1440,1024"),
        ("empty", "empty", "1440,1024"),
        ("error", "error", "1440,1024"),
        ("recovery", "recovery", "1440,1024"),
    ],
}


def find_chrome(explicit: str | None) -> str | None:
    candidates = [
        explicit,
        shutil.which("chrome"),
        shutil.which("google-chrome"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return str(Path(candidate))
    return None


def plan(surface: str, source: Path, output: Path) -> dict[str, object]:
    views = []
    for name, query_view, size in SURFACE_VIEWS[surface]:
        views.append(
            {
                "name": name,
                "query": urlencode({"view": query_view}),
                "size": size,
                "output": str(output / f"{name}.png"),
            }
        )
    return {
        "schema": "vds-render-views/v1",
        "encoding": "utf-8",
        "surface": surface,
        "source": str(source.resolve()),
        "views": views,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--surface", choices=sorted(SURFACE_VIEWS), required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--chrome")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.source.is_file():
        parser.error(f"source does not exist: {args.source}")
    payload = plan(args.surface, args.source, args.output)
    if args.dry_run:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    chrome = find_chrome(args.chrome)
    if not chrome:
        parser.error("Chrome/Chromium was not found; pass --chrome")
    args.output.mkdir(parents=True, exist_ok=True)
    base = args.source.resolve().as_uri()
    with tempfile.TemporaryDirectory(prefix="vds-render-profiles-") as temp_profiles:
        for index, view in enumerate(payload["views"]):
            target = Path(view["output"])
            url = f"{base}?{view['query']}"
            profile = Path(temp_profiles) / f"profile-{index}"
            command = [
                chrome,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                "--force-device-scale-factor=1",
                f"--window-size={view['size']}",
                "--virtual-time-budget=1200",
                f"--user-data-dir={profile}",
                f"--screenshot={target}",
                url,
            ]
            result = subprocess.run(command, text=True, capture_output=True)
            if result.returncode != 0 or not target.is_file():
                print(result.stdout + result.stderr, file=sys.stderr)
                return result.returncode or 1
            view["bytes"] = target.stat().st_size
            view["sha256"] = hashlib.sha256(target.read_bytes()).hexdigest()
    manifest = args.output / "render-manifest.json"
    manifest.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

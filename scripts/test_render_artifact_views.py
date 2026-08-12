#!/usr/bin/env python3
"""Regression tests for the cross-surface render-view planner."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / "render_artifact_views.py"


EXPECTED = {
    "poster": {"full", "thumbnail", "copy-hidden", "image-hidden", "bottom"},
    "graphic-text": {"pages", "contact-sheet", "reading-sequence"},
    "slides": {"pages", "contact-sheet", "densest", "bottom"},
    "ui": {"default", "long-copy", "empty", "error", "recovery"},
}


def main() -> int:
    with tempfile.TemporaryDirectory() as temp:
        source = Path(temp) / "master.html"
        source.write_text("<!doctype html><meta name='viewport' content='width=device-width'>", encoding="utf-8")
        for surface, expected in EXPECTED.items():
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--surface",
                    surface,
                    "--source",
                    str(source),
                    "--output",
                    str(Path(temp) / surface),
                    "--dry-run",
                ],
                text=True,
                capture_output=True,
            )
            if result.returncode != 0:
                raise AssertionError(result.stdout + result.stderr)
            payload = json.loads(result.stdout)
            actual = {item["name"] for item in payload["views"]}
            if actual != expected:
                raise AssertionError(f"{surface}: expected {expected}, got {actual}")
            if payload["encoding"] != "utf-8":
                raise AssertionError(f"{surface}: expected utf-8 declaration")
        chrome = shutil.which("chrome") or r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        if Path(chrome).is_file():
            rendered = Path(temp) / "rendered"
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--surface",
                    "poster",
                    "--source",
                    str(source),
                    "--output",
                    str(rendered),
                    "--chrome",
                    chrome,
                ],
                text=True,
                capture_output=True,
            )
            if result.returncode != 0:
                raise AssertionError(result.stdout + result.stderr)
            leaked = list(rendered.glob(".chrome-profile-*"))
            if leaked:
                raise AssertionError(f"temporary Chrome profiles leaked into output: {leaked}")
    print("V3.1 RENDER VIEW TESTS: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

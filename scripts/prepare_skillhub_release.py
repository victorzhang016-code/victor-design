#!/usr/bin/env python3
"""Prepare a deterministic, review-friendly SkillHub source directory.

The SkillHub CLI still owns validation, filtering, archiving, and upload. This
script only selects authored runtime and reference files from the GitHub
repository so development fixtures and dependency lockfiles do not become
part of the published skill by accident.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


EXCLUDED_DIRS = {".git", "node_modules", "test-results", "__pycache__", "tests", "fixtures"}
EXCLUDED_FILES = {
    ".gitignore",
    "LICENSE",
    "README.md",
    "package-lock.json",
    "prepare_skillhub_release.py",
    "test_design_execution.py",
    "test-mock.js",
}
ALLOWED_EXTENSIONS = {".md", ".txt", ".html", ".htm", ".css", ".js", ".py", ".json", ".xml"}


def keep(path: Path, root: Path) -> bool:
    relative = path.relative_to(root)
    if any(part in EXCLUDED_DIRS for part in relative.parts):
        return False
    if path.name in EXCLUDED_FILES:
        return False
    return path.suffix.lower() in ALLOWED_EXTENSIONS


def prepare(source: Path, output: Path) -> int:
    source = source.resolve()
    output = output.resolve()
    if source == output or output in source.parents:
        raise SystemExit("output must be outside the source tree")
    if not (source / "SKILL.md").is_file():
        raise SystemExit(f"source does not contain SKILL.md: {source}")
    if output.exists():
        raise SystemExit(f"output already exists; choose a new path: {output}")

    copied = 0
    for path in source.rglob("*"):
        if not path.is_file() or not keep(path, source):
            continue
        relative = path.relative_to(source)
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, destination)
        copied += 1

    if not (output / "SKILL.md").is_file():
        raise SystemExit("release output is missing SKILL.md")
    print(f"prepared {copied} files at {output}")
    return copied


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    prepare(args.source, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

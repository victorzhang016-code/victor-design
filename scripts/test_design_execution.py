#!/usr/bin/env python3
"""Run validation fixtures and optionally prove an external delivery fails."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VALIDATOR = ROOT / "validate_design_execution.py"
AUDIT = ROOT / "audit_html_design.py"
FIXTURES = ROOT / "fixtures"


def run(path: Path, expected: int) -> None:
    result = subprocess.run(
        [sys.executable, str(VALIDATOR), str(path), "--poster", "--figma-required", "--from-zero"],
        text=True,
        capture_output=True,
    )
    if result.returncode != expected:
        raise AssertionError(f"{path}: expected {expected}, got {result.returncode}\n{result.stdout}{result.stderr}")
    print(result.stdout.strip())


def run_audit(path: Path, expected: int) -> None:
    result = subprocess.run(
        [sys.executable, str(AUDIT), str(path), "--strict"],
        text=True,
        capture_output=True,
    )
    if result.returncode != expected:
        raise AssertionError(f"{path}: expected {expected}, got {result.returncode}\n{result.stdout}{result.stderr}")
    print(result.stdout.strip())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--external-delivery", type=Path, help="existing external delivery expected to fail")
    args = parser.parse_args()
    run(FIXTURES / "positive-poster", 0)
    run(FIXTURES / "negative-poster", 1)
    run_audit(FIXTURES / "positive-poster" / "master.html", 0)
    run_audit(FIXTURES / "negative-poster" / "master.html", 1)
    if args.external_delivery:
        run(args.external_delivery, 1)
    print("V3 FIXTURES: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())

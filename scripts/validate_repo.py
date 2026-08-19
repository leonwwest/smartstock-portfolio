from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)


required = [
    ROOT / "index.html",
    ROOT / "webapp" / "Component.js",
    ROOT / "webapp" / "manifest.json",
    ROOT / "webapp" / "localService" / "metadata.xml",
    ROOT / "webapp" / "localService" / "mockdata" / "Products.json",
    ROOT / "webapp" / "localService" / "mockdata" / "Orders.json",
]

for path in required:
    if not path.is_file():
        fail(f"Pflichtdatei fehlt: {path.relative_to(ROOT)}")

for path in sorted((ROOT / "webapp").rglob("*.js")):
    result = subprocess.run(
        ["node", "--check", str(path)],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode:
        fail(f"JavaScript-Syntaxfehler in {path.relative_to(ROOT)}\n{result.stderr}")

for path in sorted((ROOT / "webapp").rglob("*.json")):
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        fail(f"Ungültiges JSON in {path.relative_to(ROOT)}: {error}")

for path in sorted((ROOT / "webapp").rglob("*.xml")):
    try:
        ET.parse(path)
    except (OSError, ET.ParseError) as error:
        fail(f"Ungültiges XML in {path.relative_to(ROOT)}: {error}")

print("SmartStock-Portfolio erfolgreich validiert.")

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "puzzle-kit/wiring/assets/original/pipe-pieces.png"
OUT_DIR = SOURCE.parent
MANIFEST = OUT_DIR / "pieces-manifest.json"

# The supplied source sheet is laid out as:
# top-left straight, top-right elbow, bottom-left cross, bottom-right tee.
LAYOUT = {
    "straight": (0, 0),
    "elbow": (1, 0),
    "cross": (0, 1),
    "tee": (1, 1),
}


def alpha_bbox(image: Image.Image, quadrant: tuple[int, int]) -> tuple[int, int, int, int]:
    width, height = image.size
    half_w, half_h = width // 2, height // 2
    qx, qy = quadrant
    left = 0 if qx == 0 else half_w
    right = half_w if qx == 0 else width
    top = 0 if qy == 0 else half_h
    bottom = half_h if qy == 0 else height

    quad = image.crop((left, top, right, bottom))
    alpha = quad.getchannel("A")
    # Ignore near-zero alpha residue when finding the visual bounds. The actual
    # pixels inside the final crop remain untouched. Keep a transparent margin
    # so antialiasing and the original soft edge are retained.
    visible = alpha.point(lambda value: 255 if value >= 16 else 0)
    local = visible.getbbox()
    if local is None:
        raise RuntimeError(f"No visible pixels found in quadrant {quadrant}")

    padding = 10
    lx0, ly0, lx1, ly1 = local
    lx0 = max(0, lx0 - padding)
    ly0 = max(0, ly0 - padding)
    lx1 = min(quad.width, lx1 + padding)
    ly1 = min(quad.height, ly1 + padding)
    return left + lx0, top + ly0, left + lx1, top + ly1


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source sheet: {SOURCE}")

    with Image.open(SOURCE) as opened:
        if opened.format != "PNG":
            raise SystemExit(f"Expected PNG source, got {opened.format}")
        if "A" not in opened.getbands():
            raise SystemExit("pipe-pieces.png must keep its transparent alpha channel")

        source = opened.convert("RGBA")
        source_info = dict(opened.info)

    manifest = {
        "source": SOURCE.name,
        "sourceSize": {"width": source.width, "height": source.height},
        "method": "lossless crop using alpha>=16 visual bounds + 10px transparent margin; no resize; no recolor",
        "pieces": {},
    }

    for name, quadrant in LAYOUT.items():
        box = alpha_bbox(source, quadrant)
        piece = source.crop(box)
        output = OUT_DIR / f"pipe-{name}.png"

        save_args = {}
        icc = source_info.get("icc_profile")
        if icc:
            save_args["icc_profile"] = icc
        dpi = source_info.get("dpi")
        if dpi:
            save_args["dpi"] = dpi

        # PNG is lossless. The crop is saved at its exact source pixels.
        piece.save(output, format="PNG", **save_args)

        raw_hash = hashlib.sha256(piece.tobytes()).hexdigest()
        manifest["pieces"][name] = {
            "file": output.name,
            "cropBox": list(box),
            "width": piece.width,
            "height": piece.height,
            "pixelSha256": raw_hash,
        }
        print(f"{name}: box={box} size={piece.size} -> {output.relative_to(ROOT)}")

    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

#!/usr/bin/env python
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


@dataclass(frozen=True)
class Margin:
    left: int
    top: int
    right: int
    bottom: int


def _avg_rgb(pixels: list[tuple[int, int, int]]) -> tuple[float, float, float]:
    n = max(1, len(pixels))
    return (
        sum(p[0] for p in pixels) / n,
        sum(p[1] for p in pixels) / n,
        sum(p[2] for p in pixels) / n,
    )


def _estimate_bg(img: Image.Image) -> tuple[float, float, float]:
    w, h = img.size
    # Use corner sampling to approximate background (works with gradients).
    boxes = [
        (0, 0, 64, 64),
        (w - 64, 0, w, 64),
        (0, h - 64, 64, h),
        (w - 64, h - 64, w, h),
    ]
    samples: list[tuple[int, int, int]] = []
    for x0, y0, x1, y1 in boxes:
        crop = img.crop((x0, y0, x1, y1))
        samples.extend(list(crop.getdata()))
    return _avg_rgb(samples)


def _is_bg(px: tuple[int, int, int], bg: tuple[float, float, float], thr: int) -> bool:
    return (abs(px[0] - bg[0]) + abs(px[1] - bg[1]) + abs(px[2] - bg[2])) < thr


def _luma(px: tuple[int, int, int]) -> float:
    r, g, b = px
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _content_bbox_luma(
    img: Image.Image,
    luma_threshold: float,
    ignore_bottom_px: int,
) -> tuple[int, int, int, int] | None:
    w, h = img.size
    px = img.load()

    min_x, min_y = w, h
    max_x, max_y = -1, -1

    scan_h = max(1, h - max(0, ignore_bottom_px))

    for y in range(scan_h):
        for x in range(w):
            if _luma(px[x, y]) >= luma_threshold:
                if x < min_x:
                    min_x = x
                if y < min_y:
                    min_y = y
                if x > max_x:
                    max_x = x
                if y > max_y:
                    max_y = y

    if max_x < 0:
        return None
    return min_x, min_y, max_x, max_y


def _content_bbox(
    img: Image.Image,
    thr: int,
    ignore_bottom_px: int,
) -> tuple[int, int, int, int] | None:
    w, h = img.size
    bg = _estimate_bg(img)
    px = img.load()

    min_x, min_y = w, h
    max_x, max_y = -1, -1

    scan_h = max(1, h - max(0, ignore_bottom_px))

    # Full scan: 3840x2160 at scale2 is OK for occasional full checks.
    for y in range(scan_h):
        for x in range(w):
            if not _is_bg(px[x, y], bg, thr):
                if x < min_x:
                    min_x = x
                if y < min_y:
                    min_y = y
                if x > max_x:
                    max_x = x
                if y > max_y:
                    max_y = y

    if max_x < 0:
        return None
    return min_x, min_y, max_x, max_y


def _margins(img: Image.Image, bbox: tuple[int, int, int, int]) -> Margin:
    w, h = img.size
    x0, y0, x1, y1 = bbox
    return Margin(left=x0, top=y0, right=w - 1 - x1, bottom=h - 1 - y1)


def _iter_slide_images(dir_path: Path, prefix: str) -> list[Path]:
    # Marp may output images in a flat layout (e.g., _pagecheck/zh.001)
    # or inside a directory (e.g., _pagecheck/zh/zh.001). Also, files may have
    # no extension.
    pat = f"{prefix}.*"
    files = sorted([p for p in dir_path.rglob(pat) if p.is_file()])

    # Marp may leave behind legacy outputs like "speaker.001" (suffix ".001")
    # alongside standard images like "speaker.001.png". When standard image
    # formats exist, prefer them to avoid checking stale/duplicate files.
    preferred_exts = {".png", ".jpg", ".jpeg"}
    if any(p.suffix.lower() in preferred_exts for p in files):
        files = [p for p in files if p.suffix.lower() in preferred_exts]

    # Common pitfall: passing _pagecheck/zh (empty dir) while images are at
    # _pagecheck/zh.001. In that case, fall back to scanning the parent.
    if not files and dir_path.name == prefix and dir_path.parent.exists():
        files = sorted([p for p in dir_path.parent.rglob(pat) if p.is_file()])

    return files


def main() -> int:
    ap = argparse.ArgumentParser(description="Check Marp slide images for edge-safe margins.")
    ap.add_argument("--dir", required=True, help="Directory containing rendered slide PNGs")
    ap.add_argument("--prefix", required=True, help="Filename prefix like zh or en")
    ap.add_argument("--min-left", type=int, default=72)
    ap.add_argument("--min-right", type=int, default=72)
    ap.add_argument("--min-top", type=int, default=56)
    ap.add_argument("--min-bottom", type=int, default=160)
    ap.add_argument(
        "--ignore-bottom",
        type=int,
        default=220,
        help="Ignore this many pixels from the bottom (footer/pagination area)",
    )
    ap.add_argument(
        "--mode",
        choices=["luma", "bg"],
        default="luma",
        help="How to detect visible content pixels (default: luma)",
    )
    ap.add_argument(
        "--luma-threshold",
        type=float,
        default=80.0,
        help="Luminance threshold used when --mode=luma",
    )
    ap.add_argument("--bg-threshold", type=int, default=34, help="L1 distance threshold for bg detection")
    ap.add_argument("--max", type=int, default=0, help="Limit number of slides to check (0 = all)")
    args = ap.parse_args()

    base = Path(args.dir)
    images = _iter_slide_images(base, args.prefix)
    if args.max and args.max > 0:
        images = images[: args.max]

    failures: list[tuple[str, Margin]] = []
    for path in images:
        img = Image.open(path).convert("RGB")
        if args.mode == "luma":
            bbox = _content_bbox_luma(
                img, luma_threshold=args.luma_threshold, ignore_bottom_px=args.ignore_bottom
            )
        else:
            bbox = _content_bbox(
                img, thr=args.bg_threshold, ignore_bottom_px=args.ignore_bottom
            )
        if bbox is None:
            continue
        m = _margins(img, bbox)

        if (
            m.left < args.min_left
            or m.right < args.min_right
            or m.top < args.min_top
            or m.bottom < args.min_bottom
        ):
            failures.append((path.name, m))

    total = len(images)
    print(f"Checked {total} slides in {base} (prefix={args.prefix}).")
    if not failures:
        print("OK: No slides violate the configured minimum margins.")
        return 0

    print(f"FAIL: {len(failures)} slide(s) violate minimum margins:")
    for name, m in failures:
        print(
            f"- {name}: left={m.left}px top={m.top}px right={m.right}px bottom={m.bottom}px"
        )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

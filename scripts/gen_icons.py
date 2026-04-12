# -*- coding: utf-8 -*-
"""Generate LogLens Tauri icons (lens motif, indigo on white rounded tile)."""
from __future__ import division, print_function

import io
import math
import os
import struct
import sys

from PIL import Image, ImageDraw

INDIGO = (79, 70, 229, 255)
INDIGO_MUTED = (99, 102, 241, 255)
WHITE = (255, 255, 255, 255)


def draw_icon(output_size):
    scale = 4
    s = int(output_size * scale)
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    m = int(s * 0.10)
    rr = int(s * 0.20)
    d.rounded_rectangle(
        [m, m, s - m, s - m],
        radius=rr,
        fill=WHITE,
        outline=INDIGO_MUTED,
        width=max(1, s // 128),
    )

    cx = s * 0.44
    cy = s * 0.44
    r = s * 0.145
    sw = max(int(s / 48), 2)
    d.ellipse(
        [cx - r, cy - r, cx + r, cy + r],
        outline=INDIGO,
        width=sw,
    )

    ang = math.radians(42)
    x0 = cx + r * 0.65
    y0 = cy + r * 0.65
    hlen = s * 0.20
    x1 = x0 + hlen * math.cos(ang)
    y1 = y0 + hlen * math.sin(ang)
    d.line([(x0, y0), (x1, y1)], fill=INDIGO, width=int(sw * 2.2))

    out = img.resize((output_size, output_size), Image.LANCZOS)
    return out


def save_ico_multi_png(path, images):
    """Write a Windows .ico containing PNG-encoded frames (Vista+)."""
    png_parts = []
    for im in images:
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        png_parts.append(buf.getvalue())

    n = len(png_parts)
    header = struct.pack("<HHH", 0, 1, n)
    offset = 6 + n * 16
    entries = []
    blobs = []
    for im, png in zip(images, png_parts):
        w, h = im.size
        bw = 0 if w >= 256 else w
        bh = 0 if h >= 256 else h
        size_bytes = len(png)
        entries.append(
            struct.pack(
                "<BBBBHHII",
                bw,
                bh,
                0,
                0,
                1,
                32,
                size_bytes,
                offset,
            )
        )
        blobs.append(png)
        offset += size_bytes

    with open(path, "wb") as f:
        f.write(header)
        for e in entries:
            f.write(e)
        for b in blobs:
            f.write(b)


def build_icns_embed_png(png_bytes):
    chunk_type = b"ic08"
    chunk_len = 8 + len(png_bytes)
    chunk = chunk_type + struct.pack(">I", chunk_len) + png_bytes
    file_len = 8 + len(chunk)
    return b"icns" + struct.pack(">I", file_len) + chunk


def main():
    base = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..",
        "src-tauri",
        "icons",
    )
    base = os.path.normpath(base)
    os.makedirs(base, exist_ok=True)

    sizes_png = [
        ("32x32.png", 32),
        ("128x128.png", 128),
        ("128x128@2x.png", 256),
    ]
    png_256 = None
    for name, sz in sizes_png:
        im = draw_icon(sz)
        path = os.path.join(base, name)
        im.save(path, "PNG")
        if sz == 256:
            png_256 = im
        print("Wrote", path)

    ico_sizes = (16, 24, 32, 48, 64, 128, 256)
    ico_images = [draw_icon(sz) for sz in ico_sizes]
    ico_path = os.path.join(base, "icon.ico")
    save_ico_multi_png(ico_path, ico_images)
    print("Wrote", ico_path)

    if png_256 is None:
        png_256 = draw_icon(256)
    buf = io.BytesIO()
    png_256.save(buf, format="PNG")
    png_bytes = buf.getvalue()
    icns_path = os.path.join(base, "icon.icns")
    with open(icns_path, "wb") as f:
        f.write(build_icns_embed_png(png_bytes))
    print("Wrote", icns_path)

    return 0


if __name__ == "__main__":
    sys.exit(main())

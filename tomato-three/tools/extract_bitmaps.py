#!/usr/bin/env python3
"""Write the Director bitmap cast members out as PNGs.

8-bit members index the classic Mac OS system palette, which is a 6×6×6 colour
cube (white first, black displaced to 255) followed by four 10-step ramps.
"""
import sys
from pathlib import Path

from PIL import Image

from bitd import bitmaps, to_rgb


def mac_palette():
    L = [255, 204, 153, 102, 51, 0]
    pal = [(r, g, b) for r in L for g in L for b in L][:215]   # black moves to 255
    ramp = [238, 221, 187, 170, 136, 119, 85, 68, 34, 17]
    for ch in range(4):
        for v in ramp:
            pal.append((v, 0, 0) if ch == 0 else
                       (0, v, 0) if ch == 1 else
                       (0, 0, v) if ch == 2 else (v, v, v))
    pal.append((0, 0, 0))
    return pal


PAL = mac_palette()


def run(src, outdir, scale=2):
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    written = []
    for i, (name, w, h, bpp, px, pitch) in enumerate(bitmaps(src)):
        if w < 4 or h < 4:                 # spacer slivers
            continue
        img = Image.new('RGB', (w, h))
        img.putdata(to_rgb(w, h, bpp, px, pitch, PAL))
        if scale > 1:                      # keep the pixel character
            img = img.resize((w * scale, h * scale), Image.NEAREST)
        safe = (name or f'{i:02d}').replace('/', '-').replace(' ', '-').lower()
        p = outdir / f'{safe}.png'
        img.save(p)
        written.append((p.name, w, h))
    for n, w, h in written:
        print(f'   {n:<28} {w}x{h}')
    return written


if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2])

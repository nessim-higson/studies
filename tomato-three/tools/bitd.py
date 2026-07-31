#!/usr/bin/env python3
"""Decode Director BITD bitmap cast members.

BITD is a byte-run RLE; 8-bit members are palette indices, 16-bit members are
big-endian xRGB1555 with the channels stored plane-by-plane per scanline.
"""
import struct
from collections import Counter

from dxr import chunks
from dxr_extract import read_cast


def unrle(src, expected):
    out = bytearray()
    i = 0
    while i < len(src) and len(out) < expected:
        b = src[i]
        i += 1
        if b & 0x80:                      # repeat
            if i >= len(src):
                break
            out += bytes([src[i]]) * (257 - b)
            i += 1
        else:                             # literal
            out += src[i:i + b + 1]
            i += b + 1
    return bytes(out[:expected])


def read_keys(blob):
    """KEY*: owner-cast → child-chunk table. → {(castIdx, fourCC): childIdx}."""
    _hlen, _elen, _maxn = struct.unpack_from('>HHI', blob, 0)
    used = struct.unpack_from('>I', blob, 8)[0]
    out = {}
    for i in range(used):
        child, owner = struct.unpack_from('>II', blob, 12 + i * 12)
        fourcc = blob[12 + i * 12 + 8:12 + i * 12 + 12].decode('latin-1')
        out[(owner, fourcc)] = child
    return out


def bitmaps(path):
    """Yield (name, width, height, bpp, pixelbytes, pitch) per bitmap member."""
    data = open(path, 'rb').read()
    _c, cs = chunks(data)
    by_idx = {i: (tag, off, ln) for i, tag, off, ln in cs}

    def body(i):
        tag, off, ln = by_idx[i]
        return data[off + 8:off + 8 + ln]

    keys = {}
    for i, tag, off, ln in cs:
        if tag == 'KEY*' and ln:
            keys = read_keys(body(i))
            break

    for i, tag, off, ln in cs:
        if tag != 'CASt' or not ln:
            continue
        blob = body(i)
        ctype, infoLen, specLen = struct.unpack_from('>III', blob, 0)
        if ctype != 1 or specLen < 24:            # 1 = bitmap
            continue
        child = keys.get((i, 'BITD'))
        if child is None or child not in by_idx or by_idx[child][0] != 'BITD':
            continue
        s = blob[12 + infoLen:12 + infoLen + specLen]
        pitch = struct.unpack_from('>H', s, 0)[0] & 0x7fff
        t, l, b, r = struct.unpack_from('>hhhh', s, 2)
        w, h, bpp = r - l, b - t, s[23]
        if w <= 0 or h <= 0:
            continue
        px = unrle(body(child), pitch * h)
        if len(px) < pitch * h:
            px += b'\x00' * (pitch * h - len(px))
        yield read_cast(blob)[1], w, h, bpp, px, pitch


def to_rgb(w, h, bpp, px, pitch, palette):
    """→ list of (r,g,b) rows-major."""
    out = []
    for y in range(h):
        row = px[y * pitch:(y + 1) * pitch]
        if bpp == 8:
            for x in range(w):
                out.append(palette[row[x]] if x < len(row) else (255, 255, 255))
        elif bpp == 16:
            # channels are split into two planes across the scanline
            half = pitch // 2
            for x in range(w):
                hi, lo = row[x] if x < half else 0, row[half + x] if half + x < len(row) else 0
                v = (hi << 8) | lo
                out.append((((v >> 10) & 31) * 255 // 31,
                            ((v >> 5) & 31) * 255 // 31,
                            (v & 31) * 255 // 31))
        else:
            out.append((0, 0, 0))
    return out


def histogram(path):
    for name, w, h, bpp, px, pitch in bitmaps(path):
        c = Counter(px)
        print(f'  {name!r:24} {w}x{h} bpp={bpp} distinct={len(c)} top={c.most_common(4)}')


if __name__ == '__main__':
    import sys
    for p in sys.argv[1:]:
        print(f'== {p}')
        histogram(p)

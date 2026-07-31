#!/usr/bin/env python3
"""Probe the bitmap cast members: rect, pitch and bit depth."""
import struct
import sys
from pathlib import Path

from dxr import chunks
from dxr_extract import read_cast


def probe(path):
    data = Path(path).read_bytes()
    _c, cs = chunks(data)
    print(f'== {Path(path).name}')
    n = 0
    for _i, tag, off, ln in cs:
        if tag != 'CASt' or not ln:
            continue
        blob = data[off + 8:off + 8 + ln]
        ctype, infoLen, specLen = struct.unpack_from('>III', blob, 0)
        if ctype != 1 or specLen < 22:      # 1 = bitmap
            continue
        kind, name = read_cast(blob)
        s = blob[12 + infoLen:12 + infoLen + specLen]
        pitch = struct.unpack_from('>H', s, 0)[0] & 0x7fff
        t, l, b, r = struct.unpack_from('>hhhh', s, 2)
        regY, regX = struct.unpack_from('>hh', s, 18)
        bpp = s[23] if specLen > 23 else '?'
        print(f'   {name!r:28} {r-l:>4}x{b-t:<4} pitch={pitch:<5} bpp={bpp} '
              f'reg=({regX},{regY}) spec={specLen} tail={s[22:].hex()[:24]}')
        n += 1
        if n > 12:
            print('   …')
            break


for p in sys.argv[1:]:
    probe(p)

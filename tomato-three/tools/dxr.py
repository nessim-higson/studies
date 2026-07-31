#!/usr/bin/env python3
"""Walk a Director 6/7 (RIFX / MV93) movie and inventory its chunks.

.dxr files are 'protected' — Lingo source is stripped — but the cast members
(text, bitmaps, sounds) and the memory map are all still intact.
"""
import struct
import sys
from collections import Counter


class Reader:
    def __init__(self, buf, pos=0, be=True):
        self.b, self.p, self.be = buf, pos, be

    def u8(self):
        v = self.b[self.p]
        self.p += 1
        return v

    def u16(self):
        v = struct.unpack_from('>H' if self.be else '<H', self.b, self.p)[0]
        self.p += 2
        return v

    def u32(self):
        v = struct.unpack_from('>I' if self.be else '<I', self.b, self.p)[0]
        self.p += 4
        return v

    def tag(self):
        v = self.b[self.p:self.p + 4].decode('latin-1')
        self.p += 4
        return v if self.be else v[::-1]


def chunks(data):
    """Return [(index, tag, offset, length)] from the mmap."""
    r = Reader(data)
    assert r.tag() == 'RIFX', 'not a RIFX movie'
    r.u32()
    codec = r.tag()

    # imap immediately follows the header
    assert r.tag() == 'imap'
    r.u32()          # imap length
    r.u32()          # mmap count
    mmap_off = r.u32()

    m = Reader(data, mmap_off)
    assert m.tag() == 'mmap'
    m.u32()                      # mmap chunk length
    m.u16()                      # header length
    m.u16()                      # entry length (24)
    m.u32(); m.u32()             # chunk count max / used
    m.u32(); m.u32(); m.u32()    # junk / free / free head pointers

    out = []
    count = struct.unpack_from('>I', data, mmap_off + 16)[0]
    for i in range(count):
        base = mmap_off + 8 + 24 + i * 20  # header(24) then 20-byte entries
        tag = data[base:base + 4].decode('latin-1')
        ln, off = struct.unpack_from('>II', data, base + 4)
        out.append((i, tag, off, ln))
    return codec, out


def main(path):
    data = open(path, 'rb').read()
    codec, cs = chunks(data)
    print(f'== {path}  ({len(data)} bytes, {codec}) ==')
    tally = Counter(t for _, t, _, _ in cs)
    for tag, n in tally.most_common():
        total = sum(l for _, t, _, l in cs if t == tag)
        print(f'   {tag!r:10} x{n:<5} {total:>9} bytes')
    return cs


if __name__ == '__main__':
    for p in sys.argv[1:]:
        try:
            main(p)
        except Exception as e:
            print(f'!! {p}: {e}')
        print()

#!/usr/bin/env python3
"""Extract the readable content out of Director 6/7 .dxr movies.

Pulls STXT text cast members and the cast-member names out of the CastInfo
lists, so a protected movie still yields its copy, its labels and its
frame markers.
"""
import json
import struct
import sys
from pathlib import Path

from dxr import chunks


def clean(s):
    return (s.replace('\r', '\n')
             .replace('\x00', '')
             .strip())


def read_stxt(blob):
    """STXT: u32 text offset, u32 text length, u32 style length, then text."""
    off, tlen, _slen = struct.unpack_from('>III', blob, 0)
    return clean(blob[off:off + tlen].decode('mac-roman', 'replace'))


def read_list(blob, pos):
    """Director's offset-table 'list' structure → [bytes]."""
    dataOff = struct.unpack_from('>I', blob, pos)[0]
    p = pos + dataOff
    n = struct.unpack_from('>H', blob, p)[0]
    offs = struct.unpack_from(f'>{n + 1}I', blob, p + 2)
    items_base = p + 2 + (n + 1) * 4
    return [blob[items_base + offs[i]:items_base + offs[i + 1]] for i in range(n)]


CAST_TYPES = {1: 'bitmap', 2: 'filmLoop', 3: 'text', 4: 'palette', 5: 'picture',
              6: 'sound', 7: 'button', 8: 'shape', 9: 'movie', 10: 'digitalVideo',
              11: 'script', 12: 'richText', 13: 'ole', 14: 'transition', 15: 'xtra'}


def read_cast(blob):
    """CASt: u32 type, u32 infoLen, u32 specificLen, info…, specific…"""
    ctype, infoLen, _specLen = struct.unpack_from('>III', blob, 0)
    name = ''
    if infoLen:
        try:
            items = read_list(blob, 12)
            # item 1 is the member name, a Pascal-style string
            if len(items) > 1 and items[1]:
                raw = items[1]
                name = clean(raw[1:1 + raw[0]].decode('mac-roman', 'replace'))
        except Exception:
            pass
    return CAST_TYPES.get(ctype, f'type{ctype}'), name


def read_labels(blob):
    """VWLB: frame-marker labels — u16 count, (u16 frame, u16 offset)*, text."""
    n = struct.unpack_from('>H', blob, 0)[0]
    if not n:
        return []
    ents = [struct.unpack_from('>HH', blob, 2 + i * 4) for i in range(n)]
    base = 2 + n * 4
    out = []
    for i, (frame, off) in enumerate(ents):
        end = ents[i + 1][1] if i + 1 < len(ents) else len(blob) - base
        out.append((frame, clean(blob[base + off:base + end].decode('mac-roman', 'replace'))))
    return [(f, t) for f, t in out if t]


def main(path):
    data = Path(path).read_bytes()
    _codec, cs = chunks(data)
    res = {'file': Path(path).name, 'texts': [], 'members': [], 'labels': []}
    for _i, tag, off, ln in cs:
        if not ln or off + 8 > len(data):
            continue
        blob = data[off + 8:off + 8 + ln]
        try:
            if tag == 'STXT':
                t = read_stxt(blob)
                if t:
                    res['texts'].append(t)
            elif tag == 'CASt':
                kind, name = read_cast(blob)
                if name:
                    res['members'].append(f'{kind}: {name}')
            elif tag == 'VWLB':
                res['labels'] += [f'{f}: {t}' for f, t in read_labels(blob)]
        except Exception:
            continue
    return res


if __name__ == '__main__':
    out = [main(p) for p in sys.argv[1:]]
    print(json.dumps(out, indent=1, ensure_ascii=False))

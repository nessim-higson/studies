# tomato.three — 1999 CD-ROM, recovered

The third Tomato CD-ROM (Tomato Interactive, London, 1999), ingested off the disc folder
and made viewable in a browser.

- **Local:** http://localhost:4190/tomato-three/
- **Source:** `~/Desktop/tomato.three/` — left untouched; everything here is a copy or a
  transcode.

## What was on the disc

A Macromedia Director 6 title (`RIFX`/`MV93`, big-endian, Mac-only — the projector is a
classic PPC binary that no current machine will run). Alongside it:

| | |
|---|---|
| `assets/images/` | 98 JPEGs, 425×170, in 34 project folders |
| `assets/*.mov` | showreel (Sorenson SVQ1) + 4 sound pieces (QDM2) |
| `assets/talkmovs/` | 16 spoken-word clips (IMA ADPCM) |
| `assets/*.dxr` | 8 protected Director movies — the interface itself |

## What this build does

1. **The running order came out of `book.dxr`.** The gallery was stored as a Lingo
   property list — `[[#header: 1, #file: "01.jpg", #folder: "adidas"], …]` — where
   `#header` flags the plate that opened each project. That list is `projects.json`, so
   the page's sequence is the disc's own rather than alphabetical-by-filename. It
   resolves to exactly 34 projects / 98 plates, matching the folders on disc.

2. **The media was transcoded, not rewrapped.** SVQ1, QDM2 and IMA ADPCM are all dead to
   browsers. Video → H.264 (2× nearest-neighbour, keeping the pixel character),
   audio → MP3.

3. **The interface typography was decompressed out of the Director casts.** Every word of
   the UI was drawn as an 8-bit bitmap, so the nav labels, the contact strip, the network
   error strings, the credits line and the 16 spoken-word plates were all recovered as
   pixels. The spoken plates were then transcribed into `spoken.json` — the 16 clips are
   one continuous text, ending "this is the parallax between now and then. / our parallax
   view."

## Reading a `.dxr`

A `.dxr` is a *protected* Director movie: the Lingo source is stripped, but the cast
survives intact. The tools in `tools/` are a small, dependency-light reader for it:

| | |
|---|---|
| `dxr.py` | walks `imap` → `mmap` and inventories every chunk |
| `dxr_extract.py` | `STXT` text, `CASt` member names, `VWLB` frame labels |
| `bitd.py` | `KEY*` cast→data mapping + the `BITD` byte-run RLE |
| `extract_bitmaps.py` | `BITD` → PNG via the classic Mac system palette |
| `probe_bitmap.py` | dumps rect / pitch / bit depth per bitmap member |
| `manifest.py` | the `book.dxr` Lingo list → `projects.json` |

Two things worth remembering for the next disc:

- **Pair casts to data through `KEY*`, never by index order.** Nth-`CASt`-to-Nth-`BITD`
  looks right and silently mismatches; here it scrambled which transcript went with which
  clip, and the giveaway was that the text stopped reading as continuous prose.
- **8-bit `BITD` indexes the classic Mac system palette** — a 6×6×6 colour cube with white
  at 0 and black displaced to 255, then four 10-step ramps. `extract_bitmaps.py` rebuilds
  it rather than guessing greys.

```bash
python3 tools/dxr.py ~/Desktop/tomato.three/assets/*.dxr        # chunk inventory
python3 tools/extract_bitmaps.py <movie.dxr> <outdir>           # cast art → PNG
```

## Layout

```
index.html      the archive page
projects.json   34 projects / 98 plates, in the disc's order (from book.dxr)
spoken.json     the 16-part spoken text, transcribed
images/         the 98 plates, folder structure as on disc
media/          tomreel.mp4 · 4 sound pieces · talk/01-16.mp3
media/nav/      recovered nav typography
media/spoken/   the 16 spoken plates as they appeared
media/misc/     contact strip, network strings, archive frame
source/         book-manifest.lingo — the raw list as found
tools/          the Director reader
```

## Rights

Tomato's work, © tomato 1999. This is an archived study of a disc that was never ported
and doesn't run on any current machine — not affiliated with Tomato. Flip the study's row
to `localOnly: true` in the studies index to keep it off the public site.

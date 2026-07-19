# COMPRESSION — STATE

Last updated: 2026-07-19 · build v109 · status: **working, motion-design pass complete**

Live: https://nessim-higson.github.io/studies/compression/
Local: `compression` in prototypes/.claude/launch.json → http://localhost:4215
Source of truth: `~/CLAUDE/projects/prototypes/compression/` (backed up via the
studies repo, github.com/nessim-higson/studies; frozen snapshot in `_versions/compression/v1/`)

## What we are trying to do

Rebuild the compression-engine film from Molly.studio's "Primal" thesis
(molly.studio/thesis/primal) as a **live, interactive DOM engine** — not a video.
Molly (Marvin Schwaibold + Jaytel's studio, acquired by Shopify Aug 2025) frames
content display as a compression problem: one content atom — image, title, blurb,
CTA — exists at every scale at once, and the layout is just the current
compression level. Their three values: *compress to sharpen · design for depth ·
apply patterns for clarity.* This is Marvin-lineage study #3 (after card-toss and
card-unfold).

The demo: ONE atom morphs continuously through nine canonical display patterns,
most-compressed to fully-decompressed:

    ICON → LABEL → SNIPPET → CARD → LIST → GRID → CAROUSEL → HERO → ARTICLE

The image is the persistent element; text layers reveal progressively; the item
multiplies into siblings for the collection states (list/grid/carousel). On the
wrap (article → icon) the article's inline pair image becomes the next loop's
icon — the atom hands off to the next work, closing the loop like the film.

## Stack

Vanilla HTML/CSS/JS + GSAP 3.13 **core only** (CDN). No framework, no build
step, no image assets. Three files: `index.html`, `style.css`, `main.js`.
Artwork = six seeded generative impressionist canvases (banded flow-field
strokes + sun disc + grain) rendered to dataURLs at boot.

## Engine (v3 — the one that works)

Hand-rolled morph layer; **GSAP Flip was tried and rejected twice**:
- `absolute: true` yanks morphers out of flow → siblings lay out without them,
  then SNAP into place at morph end.
- in-flow Flip → layout shifts under the transform compensation every frame → WOBBLE.

v3 removes layout from the flight path entirely:

1. Persistent nodes (img/ttl/bod/cta/surface per item, created once, reparented
   between states — never re-created, so images never re-decode).
2. On transition: measure old scene rects → mount new layout hidden → measure
   new rects → lift every player into a fixed-position morph layer (`#ghosts`),
   comment-node placeholders remembering their slots.
3. Tween `left/top/width/height/borderRadius/boxShadow` numerically between
   viewport rects — pure interpolation, layout never participates, so wobble
   and snap are geometrically impossible.
4. At landing (`tl.call` at timeline end): reveal layout, slot nodes home,
   clear inline styles, bench unused nodes in a hidden container.
5. One master timeline per transition; interrupts run `progress(1).kill()` —
   scrub-safe at any speed.

Motion system: surfaces lead, images +0.045s, text +0.09s; durations scale with
travel (0.55–0.95s, `expo.inOut`); arrivals cascade in reading order
(`expo.out`, spatial sort); exits fade 0.26s; box-shadow (elevation) tweens
with size; big font-size jumps (ratio > 1.25) crossfade instead of morphing;
skeleton bars appear where incoming text lands, dissolving as real text
blur-resolves. Boot renders statically (background tabs get no rAF).

## Controls

Stepper dots / ← → / ‹ › = direct state control, static by default. AUTO =
opt-in loop (dwell + real flight time per state). Click artwork in
list/grid/carousel → that work becomes the atom, jumps to its card. "Learn
more" anywhere → decompresses that work to its article. Reduced-motion: all
transitions instant.

## Verified

Every successive transition frame-stepped in real Chrome via manual GSAP clock
(`gsap.ticker.remove(gsap.updateRoot)` + `gsap.updateRoot(t += dt)` +
screenshots — works in hidden tabs where rAF is dead). Full loop + wrap +
interruptions settle clean: no stuck inline styles, morph layer empty, console
clean. Frame *pacing* (fps) is the one thing this can't measure — judge on
device.

## Known gaps / next levers

- **Typography** is system SF; the reference uses a real grotesk. Inter/Söhne
  with tightened metrics is the single biggest remaining fidelity lever.
- Shadows tween linearly; could ease elevation on its own curve.
- No drag/scrub input (states are click/key-driven); a scrubber mapping drag
  distance to compression level would make the engine tactile.
- Carousel is static (no drift/inertia); the film implies slow autonomous flow.
- Artwork palette count fixed at 6; could seed infinitely.

## Deploy

`cd ~/CLAUDE/projects/prototypes && ./publish.sh "msg"` → rsyncs into
~/CLAUDE/projects/studies (git) → pushes → GitHub Pages. Freeze a version:
`./snapshot.sh compression` → `_versions/compression/vN/`.

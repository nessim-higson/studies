# COMPRESSION — STATE

Last updated: 2026-07-19 · status: **001 complete (v2 frozen) · 002 "ABSTRACT" built · 003 "ALTITUDE" built**

## 003 — ALTITUDE (semantic zoom)

`003.html/css/js`. The runner-up concept from the same judged exploration,
built on request. Compression = camera distance: one zoom scalar z ∈ [0,5]
spans six altitude bands — FIELD (six works scattered as icons) → LABELS →
GRID → CARD → HERO → ARTICLE. Scroll/pinch/drag changes altitude; the cursor
AIMS the descent (nearest work becomes the candidate; crossing into CARD
locks it as the atom, siblings fall to a left icon rail — rail click switches
atoms). Engine: every band typeset + measured at boot (per-atom bands cached
lazily, cache keyed by stage size); the frame is a pure function of z —
geometry lerped between measured rects, presence via decode/fade windows —
so the scrub is exact both directions and the decode runs backwards on
ascent. Altimeter rail + arrow keys as the discrete elevator.

## 002 — ABSTRACT (the fresh take)

`002.html/css/js` in the same folder. Chosen from a 4-concept judged exploration
(semantic zoom, attention-lens, text-compression, wildcard spatial physics —
text-compression won 67/80). The reframe: 001 compressed the CONTAINER while
text rode along; 002 pins the container — **one generated painting hangs still
forever — and moves the compression axis onto the language itself.** The same
authored text exists at five real compression levels (TITLE 2 words → CAPTION →
WALL LABEL → CATALOG → ESSAY ~157) and you physically drag the writing between
them: shared words slide to their newly-typeset positions (chained LCS word
tracking across levels), everything else dissolves/materializes through cycling
letterforms. Engine: each level typeset + measured word-by-word at boot; ONE
paused master timeline scrubbed by drag (release snaps to nearest level, ticks
+ arrow keys for discrete control); decode is a pure function of progress —
scrub-exact both directions. Summarization as a physical act.

---

# 001 — canonical build (below)

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

Motion system (the direction that made it click): **the image leads — it is
the only thing that travels (surface a beat behind, +0.05s); text never
morphs.** All text/CTAs exit together at t=0 (0.18s fade) and re-enter as the
lead morph is landing (anchor = max(0.3, morphEnd − 0.28), stagger 0.05,
reading order) via a **letterform decode**: type resolves left-to-right
through cycling glyphs. Every glyph's true position in the naturally-shaped
text is measured with Range rects and rebuilt as absolutely-positioned cells
at exact coordinates — kerning/line breaks are frozen geometry, nothing can
shift or wrap mid-decode — and cycling glyphs are width-matched to their
target char (canvas-measured pool). No blur, no skeleton bars. Durations
scale with travel (0.55–0.95s `expo.inOut`); box-shadow (elevation) tweens
with size and is cleared at landing. Boot renders statically (background
tabs get no rAF). The decode is a pure function of tween progress, so
interrupts land it instantly. (This pass was adversarially reviewed by a
13-agent workflow; 4 confirmed defects — stale inline shadows, kerning-loss
phantom wraps, glyph-width collisions, stale comment — all fixed.)

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

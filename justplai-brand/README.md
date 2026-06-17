# Plai Pix — Brand & Concept Exploration

A working sandbox for helping a friend's startup find its brand, onboarding, and
conceptual direction. **Nothing here is final** — these are artifacts built to
react to, argue with, and steer by.

---

## What the product is

**Plai Pix** (`justplai.com`) is an **infinite-canvas pixel/block painting tool** —
tldraw/Figma-style, but for pixel art. Toolbar: paint, erase, lasso, pan, zoom.
In-app name **Plai Pix**, tagline **"Draw Your World,"** app icon a multicolor pixel
heart. The meta tag says "creative tools for kids," but the onboarding voice
(a deadpan creation-myth, "the pixel, which was pretty chill," ToS "incantations")
is pitched older — teens / young adults / the cool parent, with kids as the sweet spot.

## The core thesis

**The brand should be made of the product.** The wordmark is already built from the
tool's own pixels — so every surface (logo, loading state, empty state, launch poster)
should look like it was made *inside Plai Pix*. Coherent, near-free to produce, and
impossible to copy without copying the product.

---

## What's in here

| File | What it is |
|------|-----------|
| `index.html` | **Brand one-pager (v0.1)** — the "brand made of the product" thesis, palette ("The Plai 7"), type, mascot cast, motion/sound, the emergent-UI direction, and the audience "three doors." The page itself is rendered from blocks. |
| `onboarding-v2.html` | **Tightened onboarding flow** — keeps the creation-myth, drops the scripture, merges two duplicate screens, makes screen 3 *interactive* (you place your first pixel), moves sign-in to the end as "save." Flags the COPPA/age-gate risk. |
| `brand-directions.html` | **Four design approaches** to steer by — A · 8-Bit Arcade, B · Toy Box, C · The Instrument *(lead pick)*, D · Internet Maximalist. Each panel styled in its own aesthetic. |
| `icon-lab.html` | **Parametric icon iterator** — turn the levers (palette / dimensionality / outline / chunk / tile / CRT) and the mark re-iterates live; "Shuffle 12" + a 48/28/16px squint test. |
| `logo-types.html` | **Logo-type map** — the 7 canonical types each rendered as a possible Plai mark, then the push toward a *dynamic/generative* mark (the through-line back to "emergent UI"). |
| `emergent-sketches.html` | **Emergent-UI sketchbook** — the synthesis. A mental model (stable spine vs emergent layer), six concrete UI patterns for a system that "creates on the fly" for kids *and* adults, a live "summoned toolbar" demo, and how the loop maps to the platform. Built to unstick the "what are we building / how does the UI work" question. |

Open any file in a browser (no build step). On macOS: `open index.html`.

**`reference/`** — captured baseline of the live product (`justplai.com`):
desktop + mobile screenshots, a full-page `.mhtml` archive, and `current-site.md`
documenting the shipped state the exploration is reacting to.

---

## The questions being explored

1. **Audience / job** — which "door"? *Calm Sandbox* (3–7, parent buys) ·
   *Show-Off Loop* (8–12, kid drives) · *Maker's Ladder* (educator / skills).
   The onboarding voice already leans toward the second/broad. **Still open.**
2. **Aesthetic direction** — current lead: **C (The Instrument)** — Teenage
   Engineering / Playdate-flavored: premium, tactile, deadpan — borrowing **D**'s
   color/energy for social moments.
3. **The mark** — what *type* of logo? The heart is a pictorial mark; the bigger
   idea is a **generative/living mark** ("never the same twice," drawn in-product),
   which a make-anything-from-pixels tool is almost obligated to consider.
4. **Naming architecture** — `Plai` (platform) → `Plai Pix` (first product) →
   `Plai Draw` / `Plai Build` later? Currently drifting between JustPlai / Plai / Plai Pix.
5. **Emergent UI** — the founder's original instinct: a tool that grows its own UI.
   Mapped onto this product as *stable shell + adaptive stamps + "make it real for kids."*

## Reference touchstones

- **Dynamic/generative identity:** MIT Media Lab (40k permutations), Nordkyn
  (weather-driven), Casa da Música (Sagmeister generator).
- **Aesthetic:** Teenage Engineering / Panic Playdate, Toca Boca / Sago Mini,
  eBoy, Susan Kare.
- **Pixel craft & palettes:** Lospec, itch.io icon packs, Kenney.

---

*Built collaboratively with Claude Code. Artifacts are exploratory drafts, not a delivered brand system.*

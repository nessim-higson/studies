# Kunumi Institute — replica · STATE

Faithful rebuild of **kunuminst.org/en**. Single self-contained file: `kunumi/index.html` (+ `img/` of 37 generated webp images, ~1.4 MB).

- **Local:** http://localhost:4190/kunumi/ (served by the studies hub)
- **Live:** https://nessim-higson.github.io/studies/kunumi/?v=56
- **Frozen baseline:** `_versions/kunumi/v1/` — this STATE describes v1, deployed as site `?v=56` (commit `9185bb6`).

---

## Current behaviour (the good version)

A light-grey field (`#F5F5F5`) holding a **3D starfield of black dots** that are always visible and drift **very slowly toward the camera** (growing as they approach, then recycling to the far plane). Each dot is a node; **37 of them carry an image**. As the cursor moves, thin lines connect it to nearby dots ("context"), and each connected dot's **image pops up beside it** and tracks the dot as it drifts. Wherever you move, a small **cluster** of images blooms with a web of connector lines.

Sequence on load:
1. **Intro** — three lines cross-fade ("Kunumi is a research collective…" → "Expanding the frontiers…" → "Click anywhere or search"), auto-dismisses (~10s) or on click. Progressive-enhancement: if JS fails the overlay never raises, so the page can't render blank.
2. **Explore** — starfield + cursor-driven image clusters + the dynamic island.

Chrome: `Kunumi Institute` wordmark (top-left), `PT / EN` toggle (top-right), centered **dynamic island** ("I want to learn about [topic]" with a typewriter cycle + → / ⋯ buttons + expandable Colabs/Careers/About menu), bottom-center **"Linear"** mode toggle. Click an image → frosted **lightbox** with topic/title + a "Connected" strip to travel between related images.

**Mobile / idle:** no hover, so an **ambient virtual cursor** drifts on a slow Lissajous, weaving on its own; drag steers it, tap opens the lightbox. Touch path also uses lighter caps.

---

## Architecture (all in `index.html`)

- **One full-screen canvas** (`#field`) renders, per frame: the starfield dots, the cursor→dot context lines, and the dot-to-dot web. No DOM for dots.
- **Images are DOM** (`.node` buttons inside `#constellation`), positioned each frame at their dot's projected screen pos + offset. Only `transform`/`opacity` are written per frame (compositor-cheap); colour/shadow/z toggle via a `.lit` class on a threshold (no per-frame repaints); `will-change` only on lit tiles.
- **Starfield projection:** each dot has 3D `(cx, cy, cz)`; `z -= STAR_SPEED`; project `sx = W/2 + (cx/cz)·W/2`. Content dots are laid out on a **jittered grid back-computed into 3D** (`cx = (2·tnx−1)·z`) so they're guaranteed on-screen and evenly spaced — this is what fixed the "only catches a few images" problem.
- **Reveal:** proximity of cursor to a dot drives an eased intensity `_i` (snappy fade-up, gentle fade-out); image opacity/scale derive from `_i`.

### Key tuning constants (top of the relevant blocks)
| Const | Value | Meaning |
|---|---|---|
| `STAR_N` | 340 / 160 (touch) | number of background dots |
| `STAR_SPEED` | `0.00025` | drift-toward-camera speed (glacial) |
| `R` | `270` | cursor catch radius (px) — bigger = bigger clusters |
| `REST_S` / `PEAK_S` | `0.46` / `1.16` | image scale: grows from small as it appears |
| fade lerp | `0.5` up / `0.2` down | snappy reveal, gentle hide |
| image offset | `52px` | how far the image sits from its dot |

---

## Version history (deployed landmarks)
Every row is a deployed build. `?v` = cache-bust number in the live URL; `commit` is in the `studies` repo.
Restore any: `cd ~/CLAUDE/projects/studies && git show <commit>:kunumi/index.html > ~/CLAUDE/projects/prototypes/kunumi/index.html`

| `?v` | commit | milestone |
|---|---|---|
| 44 | `126f7f1` | Initial Kunumi Institute replica (Next.js → vanilla: intro sequence, dynamic island, particle cursor) |
| 45 | `49d7d5f` | AI-generated image constellation + connected-node navigation |
| 46 | `4ee4c3d` | ★ Cursor-driven real-time string weave — the correct mechanic |
| 47 | `b6c4533` | Denser — 37 images, wider scatter, smaller tiles |
| 48 | `8adc411` | Mobile ambient drift + perf passes |
| 49 | `6f97efa` | Images absent at rest, fade-up + grow on rollover (matches original) |
| 50 | `ba90cfd` | Faster — snappy fade-up, dormant-tile skip, lighter particles |
| 51 | `9166751` | Minimal particle trail (perf-first) |
| 52 | `40e029c` | Remove particle trail entirely; tighten reveal radius |
| 53 | `ca3c8f3` | ★ Always-on 3D starfield drifting toward camera + image↔dot links |
| 54 | `fe48605` | Images attach to moving dots (pop up beside connected dots) |
| 55 | `313593b` | Much slower dot drift |
| **56** | `9185bb6` | ⭐ Even on-screen dot distribution + wider catch radius — **frozen as `_versions/kunumi/v1`** |

(After v56 the work moved to the sibling [kunumi-nav](../kunumi-nav/STATE.md) prototype; this build is considered complete.)

## History / decisions
- Images are **absent at rest** and fade up + grow on rollover (not always-present) — corrected from an earlier always-visible version.
- The weave is **cursor-driven & real-time** (lines connect to dots, images attach to dots) — corrected from an earlier static-cluster + fixed-grid version.
- Perf passes: removed a heavy particle trail, capped DPR (1.5/1.25), dormant-tile skipping, compositor-only per-frame writes. The starfield (~340 simple arcs) is the main per-frame cost now and is cheap.
- Fonts: ABC Monument Grotesk is proprietary → using **Space Grotesk / Space Mono** fallback.
- Images are **AI-generated placeholders** (nano-banana, 6 topics) with evocative filler titles — not Kunumi's real research content.

## Open / not yet built (from reference screenshots)
- **Category pill labels** on the image cluster ("Alliance", "Modeling", "Research", "Health", "Algorithms").
- **Bottom notification card** ("Attention as a bet: what if each head of the Transformer was a…") with a thumbnail.
- Real content/titles + real fonts (swap in the actual `.woff2`) if going beyond a study.
- Recycle edge case: if a dot reaches the camera mid-reveal its image hides abruptly (rare at this slow speed) — could add fade-on-recycle.

## Workflow
- Edit `kunumi/index.html`; verify locally at `:4190/kunumi/`.
- Deploy: `./publish.sh "message"` → pushes to GitHub Pages, prints cache-busted live URL.
- Freeze: `./snapshot.sh kunumi` → `_versions/kunumi/vN/` (immutable).

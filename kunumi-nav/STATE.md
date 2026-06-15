# Nevverland nav × Kunumi finish — STATE

The Nevverland **organic tree navigation** re-rendered in the **Kunumi visual language**. Single self-contained file: `kunumi-nav/index.html` (no build, no deps). Imagery is pulled cross-folder from the Kunumi set via `../kunumi/img/…` (not duplicated).

- **Local:** http://localhost:4190/kunumi-nav/
- **Live:** https://nessim-higson.github.io/studies/kunumi-nav/
- **This STATE** describes the rolled-back baseline = git `ba2b080` (the hover-preview that was on top, `f0e657f`, was reverted by request).

---

## What it is

A light field (`#F5F5F5`, Space Grotesk) holding the Nevverland nav as a **centered organic graph** of dark gossamer threads + type, sitting in a faint Kunumi **starfield**. Navigating drills the tree; content levels turn into **Kunumi rollover image fields**; opening an image **zooms a stage**.

### Levels / behaviour
- **Landing (Nevverland, root)** — nav mode: the four categories (Work / About / Info / Contact) bloom around the focus as clickable type, threaded in. Idle = the whole composition gently wanders.
- **Category (Work / About / Info / Contact)** — **field mode**: the screen fills with dots; that category's imagery (duped per item) **floats by** and **blooms up on cursor rollover** (Kunumi mechanic). The **client/item names** show as **clickable text call-outs** around the focus. Click a name *or* an image → that item **comes forward**.
- **Item (e.g. HBO)** — field mode of its own images. Click an image → **stage**.
- **Stage** — the nav **recedes/shrinks in place** (scale .6, no side-snap) and the image **zooms to fill** the viewport, with topic + copy + a thumbnail strip. ✕ / Esc / click-away returns.

### The two latest refinements (in this baseline)
- **Clear zone** — floating images **fade out as they approach the focus**, so nothing clutters under the nav (`FIELD.CLEAR_IN` 150, `CLEAR_W` 120; follows the idle-wandering nav).
- **Nav shrinks when imagery comes up** — in field mode the type scales to **74%** (`FIELD.TYPE_SCALE`) so the work has room but the nav stays seen.

### Live controls — press **C**
A frosted panel of 9 dials, all live: Settle (damping; lower = springier), Repulsion, Thread tension, Bloom radius/strength, Idle drift, Cursor gravity, Click shock, Move energy.

---

## Architecture (all in `index.html`)
- **Hand-rolled force model** (ported from the React/d3 Nevverland `useSimulation.js`/`config.js`): role model (active/child/parent/sibling/distant), centered layout, child-ring bloom, charge, link springs, label-aware collide, cursor gravity, idle drift, click shock, damping. No d3/React.
- **One canvas** (`#field`) draws: starfield (240 dots, slow toward-camera drift), the field content-dots, cursor→revealed-image threads, and a couple of nav→starfield threads.
- **Nav labels** are SVG (`#graph`) on top; **field images** are DOM tiles (`#tiles`) beneath, so labels stay readable/clickable; `#copy` rides the focus.

### Performance model (important — this was the bug-prone part)
- Field can hold ~30 image tiles; **only the ~5–6 revealed near the cursor do work**.
- Tiles are **transform-positioned** (no `left`/`top` → no layout thrash) and **`will-change` only while revealed**.
- **Images are 1024×1024 and lazy-mounted**: an `<img>` is created only when its tile is revealed and **removed when it hides** — so **0 images decode on entering a section** (the Work-entry lag was 40 decoding at once). `decoding="async"`.
- Counts: `CAT_PER_CHILD` 6, `LEAF_FIELD_N` 9.

### Key tuning constants
| Where | Const | Value | Meaning |
|---|---|---|---|
| `P` | `DAMP` | 0.52 | settle (lower = springier) |
| `P` | `SHOCK` | 3 | click impulse |
| `P` | `CHILD_RING` | 230 | bloom radius of call-outs |
| `FIELD` | `R` | 240 | rollover reveal radius |
| `FIELD` | `TYPE_SCALE` | 0.74 | nav shrink in field mode |
| `FIELD` | `CLEAR_IN`/`CLEAR_W` | 150 / 120 | central clear zone |
| starfield | `STAR_N` | 240 | dot count |

---

## History / decisions
- Built as a blend of [[project_firstborn_tree]] (Nevverland organic mode) + [[project_kunumi_replica]] (visual language). See [[project_kunumi_nav]].
- **Reverted:** a landing hover-preview (roll a category to spring its images open) — `f0e657f`. The user didn't like it; rolled back to `ba2b080`. Don't re-add without asking.

## Open / next
- **Imagery is duped placeholders** from the Kunumi set; generate a fresh larger per-client set for variety when going beyond a study.
- **Smaller thumbnails**: the field uses 1024px sources downscaled to ~70px — biggest remaining perf win is serving ~256px thumbs.
- Real project content, real fonts (ABC Monument Grotesk) if productionising.
- Not yet frozen via `snapshot.sh` — freeze a baseline when happy.

## Workflow
- Edit `kunumi-nav/index.html`; verify at `:4190/kunumi-nav/`.
- Deploy: `./publish.sh "msg"` (from `prototypes/`) → GitHub Pages + cache-busted URL.
- Freeze: `./snapshot.sh kunumi-nav` → `_versions/kunumi-nav/vN/`.

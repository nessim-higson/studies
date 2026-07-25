# COMPRESSION — one work, nine states of reveal

Study after Molly.studio's "Primal" thesis film (molly.studio/thesis/primal) —
their "compression engine": content shifts and adapts to hierarchy, state and
intent. Third study in the Marvin Schwaibold lineage (card-toss, card-unfold —
Molly is Marvin + Jaytel's studio, acquired by Shopify Aug 2025).

## The mechanic

One content atom — image + title + blurb + CTA — morphs through nine canonical
display patterns, from fully compressed to fully decompressed:

    ICON → LABEL → SNIPPET → CARD → LIST → GRID → CAROUSEL → HERO → ARTICLE

The image is the persistent element (GSAP Flip morphs position / size / radius);
text layers blur-reveal in; the item multiplies into siblings for the collection
states. On the wrap (article → icon) the atom hands off to the next work — the
article's inline pair image becomes the new icon, closing the loop like the
reference film.

## Controls

- Stepper dots / ← → keys / ‹ › buttons — direct state control (static by default)
- AUTO — opt-in loop that plays the full cycle like the reference GIF
- Click any artwork in list / grid / carousel — promotes it to atom, jumps to its card
- "Learn more" anywhere — decompresses that work straight to article

## Build

Vanilla HTML/CSS/JS + GSAP 3.13 core (CDN). Transitions are a hand-rolled
morph layer, not GSAP Flip: both scenes are measured, then every element
tweens numerically between viewport rects in a fixed-position layer while
the real layout mounts hidden underneath — layout never participates
mid-flight, so nothing can wobble or snap. Artwork is generated at boot: six
seeded impressionist canvases (banded flow-field strokes + sun disc + grain),
rendered to dataURLs — no image assets.

Port 4215 (`compression` in .claude/launch.json).

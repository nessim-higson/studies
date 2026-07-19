# COMPRESSION V2 — STATE

Status: new independent build, ready for visual QA.

## Intent

Create a live DOM composition that feels like the Molly “Primal” compression
film rather than a labelled component explorer. The primary experience is a
silent 15.6-second autoplay loop inside a restrained 16:9 frame. Controls are
secondary and appear on hover, focus, or touch.

## Sequence

`SEED → LABEL → SNIPPET → CARD → MATRIX → RAIL → FOCUS → ARTICLE → GALLERY`

The gallery hands one of its images into the next loop’s seed. Total hold and
flight time is 15.6 seconds.

## Architecture

- Persistent DOM nodes for every artwork, title, body, action, and surface.
- Hand-rolled viewport-space morph layer; no GSAP Flip dependency.
- Destination layouts mount hidden, are measured, and receive their nodes at
  landing.
- State-specific layout composition with a shared timing system.
- Original JPEG artwork assets in `assets/`.
- Reduced-motion mode is static and manually navigable.

## Source boundaries

- `compression/` remains unchanged.
- `_versions/compression/v1/` remains unchanged.
- Molly’s film was used only as a visual and timing reference.

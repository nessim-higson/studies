# Compression v2

A separate, reference-led rebuild of the compression study. It preserves the
idea of a live DOM engine while restoring the qualities that make the Molly
“Primal” film convincing: compact framing, automatic progression, asymmetric
compositions, transition-specific pacing, restrained chrome, and strong art.

## Run

Serve the repository root and open `/compression-v2/`.

```sh
python3 -m http.server 4215
```

## Interaction

- The 15.6-second loop starts automatically.
- Click the film or press Space to pause/resume.
- Use arrow keys or the hover controls to step manually.
- Select artwork in collection states to promote it.
- “View work” opens the selected item into the article composition.
- Reduced-motion visitors receive a static card and manual controls.

## Implementation

Vanilla HTML/CSS/JS and GSAP core. Images, titles, copy, buttons, and surfaces
are persistent DOM nodes. During each transition, nodes move through a
fixed-position morph layer between measured viewport rectangles, then return to
their real layout slots. Layout never participates while geometry is moving.

The six paintings are original project assets generated for this study with the
built-in OpenAI image-generation workflow. They are substitutes informed by the
reference’s level of texture and variation, not reproductions of its artwork.

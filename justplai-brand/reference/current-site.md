# Live site baseline — justplai.com

Snapshot of the **actual shipped product** as of 2026-06-16, captured for reference.
This is the source-of-truth the exploration is reacting to.

## Captured here
- `justplai-live-desktop.png` — desktop render (1280×900)
- `justplai-live-mobile.png` — mobile render (390×844)
- `justplai-live.mhtml` — full page archive (open in a browser to inspect)

## What the live site is
A single full-bleed **infinite pixel canvas**. No marketing copy, no nav — you land
directly in the tool. The hero state spells **"JUST PLAI"** out of pixel blocks, framed
by pixel creatures (a green frog, a little pixel character, scattered tetromino bits).

- **Title:** `Just Plai`
- **Meta description:** `Creative tools for kids`
- **Wordmark color:** now rendered in **yellow/gold** pixels (earlier captures were white) —
  worth noting, the brand artifacts in this repo currently show it white.

## The toolbar (confirmed live)
A floating tool dock + zoom controls:

| Tool | Shortcut |
|------|----------|
| Open menu | — |
| New canvas | — |
| Undo | — |
| **Paint** | B *(default/active)* |
| **Erase** | E |
| **Lasso select** | M |
| **Pan** | H |
| Zoom in / out | — |

## Read
It's a tldraw/Figma-style infinite canvas, but the atomic unit is a **pixel/block** rather
than a vector shape. You start *in* the act of making — no onboarding gate on the web
(the creation-myth onboarding lives in the app). The whole identity is already emergent
from the tool: the logo is literally drawn in the product it advertises.

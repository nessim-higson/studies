# BRIEF.md — Exploration: Breeding

Letterforms arrived at by **selection**, not specification. The operator never
draws and never describes. They are shown variant forms, they pick the ones with
pull, those breed, new variants appear, repeat. After enough generations a form
emerges that could not have been specified up front but is unmistakably theirs.

Read `../../thinking/THINKING.md` and `../../CLAUDE.md` first. The cheap/expensive
line for this concept is non-negotiable: **real heredity, not a reroll button.**

## v1 target

On-screen only. A single letter to start (suggest `R` — it has a bowl, a leg, a
stem, a junction, so heredity has distinct *traits* to inherit and recombine).

The loop:
1. Screen shows **8 variant Rs** in a grid.
2. Operator clicks to select **2** (the parents).
3. Operator hits "breed."
4. 8 new Rs appear — each a **cross of the two parents** plus small mutation.
5. Repeat. A small "lineage" strip shows the path taken (the picked parents per
   generation), so the operator can see convergence happening.

That's the whole v1. No saving, no export, no alphabet. One letter, bred.

## The one thing that makes or breaks it: the genome

Heredity has to *read*. The operator must be able to look at a child and see its
parents in it. That requires a genome where traits are **separable and visible**.

Start simple and parametric so heredity is legible, then push toward stranger:

**v1 genome (start here):** a vector of named, visually-distinct traits for the R,
e.g. stem weight, bowl size, bowl roundness vs. flatness, leg angle, leg length,
junction style (where bowl meets stem), terminal treatment, overall contrast,
slant. ~8–12 genes. A child inherits each gene from one parent (or a blend),
plus a small mutation. Because genes map to *visible* features, "that leg came
from parent A" is legible. This is the safe substrate that proves the loop.

**Then test the real question:** is a parametric genome too tame? A parametric R
risks the cousin-of-itself problem (everything is a variation within the same
parameter space — the skeleton trap returns). The interesting experiment, once the
loop works, is to make the **gene pool itself alien**: genes that drive a
generative process (e.g. control points of a carved-from-noise form, or
fold-parameters of a ribbon) so the forms can be genuinely strange yet still breed.
THINKING.md flags this; don't assume the answer; prototype both and let the
operator feel the difference. The parametric version may converge nicely but feel
safe; the alien version may be exciting but breed into mush. Finding that tradeoff
IS the exploration.

## Rendering

SVG. Render the R from the genome with plain path math. Keep the render function
pure (genome in → SVG path out) so breeding is just operating on genomes. Legibility
is the constraint: a child that stops reading as an R is a failed child — consider a
soft "legibility floor" that nudges extreme genomes back, but make it gentle; the
thrill lives near the edge.

## Mutation

Small by default. Add a **mutation-rate control** the operator can raise when the
pool feels stale (escape a local optimum) or lower when closing in. This is the one
"slider" that's justified, because it's about the *search*, not the form.

## What "working" looks like

The operator runs ~8–10 generations and ends on a form they like, AND can point at
two earlier forms and say "it got that from there." If they can't trace the
lineage by eye, the heredity isn't reading — fix the genome's visibility before
anything else.

## Explicitly out of scope for v1

Multiple letters; full alphabet; export; saving/loading lineages to disk;
text input; the alien-genome version (that's the *second* experiment, after the
parametric loop proves out).

## Open questions to carry

- Blend inheritance (average the gene) vs. discrete (pick one parent's gene per
  gene)? Discrete reads as heredity more clearly; blend converges smoother. Try
  discrete first.
- How many parents — always 2, or allow 3? Start at 2.
- Does showing the lineage strip help or distract? Build it; let the operator kill
  it if it's noise.

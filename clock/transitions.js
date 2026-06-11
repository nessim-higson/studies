// ─── Transition Logic ────────────────────────────────────────────────────────
// Wipe type assignments based on scene mode pairings

export const WIPE = {
  DISSOLVE:   0,
  SWEEP_H:    1,
  SWEEP_V:    2,
  DIAGONAL:   3,
  RADIAL:     4,
  BLINDS:     5,
};

const N_WIPES = 6;

// Determine which wipe to use based on from/to scene modes
export function getTransition(fromMode, toMode, sceneType) {
  // Dark to light: horizontal sweep (reveal)
  if (fromMode === 'dark' && toMode === 'light') return WIPE.SWEEP_H;
  // Light to dark: vertical sweep (curtain drop)
  if (fromMode === 'light' && toMode === 'dark') return WIPE.SWEEP_V;
  // Interlude -> Clock: radial (time opens from center)
  if (sceneType === 'clock' && fromMode === 'dark') return WIPE.RADIAL;
  // Detail -> Interlude: blinds
  if (sceneType === 'interlude') return WIPE.BLINDS;
  // Default dark-to-dark: dissolve
  return WIPE.DISSOLVE;
}

// Cubic ease-in-out for transition blend
export function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

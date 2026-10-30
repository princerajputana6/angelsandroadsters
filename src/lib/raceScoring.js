// Named championship points tables (Trailstorm event scoring). Each preset has
// a positional table (1st…10th) and a flat value for every other finisher.
// Shared by the auto-points API and the Results UI so the two never drift.
export const SCORING_PRESETS = {
  fury: {
    key: 'fury',
    label: 'Fury Circuit (Event 1)',
    table: [100, 90, 80, 72, 65, 60, 55, 50, 46, 42],
    participation: 25,
  },
  shadow: {
    key: 'shadow',
    label: 'Shadow Run (Event 2)',
    table: [120, 108, 96, 86, 78, 72, 66, 60, 54, 48],
    participation: 30,
  },
};

export const DEFAULT_PRESET = 'fury';

export function getPreset(key) {
  return SCORING_PRESETS[key] || SCORING_PRESETS[DEFAULT_PRESET];
}

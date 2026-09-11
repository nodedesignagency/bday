/**
 * Everything you might want to tweak about the birthday balloons lives here.
 */

// How long after the app opens before the balloons start.
export const LAUNCH_DELAY_MS = 1000;

// How many balloons are in the air.
export const BALLOON_COUNT = 18;

// Balloon width in points. Small balloons read as "far away", big ones as "close".
const MIN_SIZE = 34;
const MAX_SIZE = 78;

// How long one balloon takes to cross the screen, bottom to top. Far ones
// drift, near ones hustle.
const SLOW_CYCLE_MS = 9000;
const FAST_CYCLE_MS = 5200;

export const COLORS = [
  '#FF4D6D', // raspberry
  '#FFB627', // amber
  '#4DA3FF', // twitter blue
  '#7B61FF', // violet
  '#2FD08A', // mint
  '#FF7A3D', // tangerine
  '#FF5FCB', // bubblegum
  '#37E2D5', // teal
];

const hexToRgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

// Blend a hex color toward black, for the knot under each balloon.
const shade = (hex, amount) =>
  `rgb(${hexToRgb(hex)
    .map((channel) => Math.round(channel * (1 - amount)))
    .join(', ')})`;

const random = (min, max) => min + Math.random() * (max - min);
const lerp = (from, to, t) => from + (to - from) * t;

/**
 * Builds the set of balloons. Each one rises on its own endless cycle, and its
 * `offset` is how far through that cycle it happens to be — which is what
 * spreads them up the screen instead of launching them all together.
 *
 * Balloons are spread across columns so the screen fills evenly instead of
 * clumping wherever Math.random happens to land.
 */
export function createBalloons(width) {
  const columnWidth = width / BALLOON_COUNT;

  return Array.from({ length: BALLOON_COUNT }, (_, index) => {
    const depth = Math.random(); // 0 = far away, 1 = right in front of you
    const size = lerp(MIN_SIZE, MAX_SIZE, depth);
    const column = columnWidth * (index + 0.5);
    const color = COLORS[index % COLORS.length];

    return {
      id: `balloon-${index}`,
      size,
      color,
      knotColor: shade(color, 0.22),
      // Jitter around the column, then keep the balloon mostly on screen.
      x: Math.min(Math.max(column + random(-columnWidth, columnWidth) - size / 2, -size * 0.25), width - size * 0.75),
      cycleMs: lerp(SLOW_CYCLE_MS, FAST_CYCLE_MS, depth) * random(0.9, 1.1),
      offset: Math.random(),
      // Side-to-side drift, in points, and how many full sways per crossing.
      sway: random(12, 34) * lerp(0.6, 1, depth),
      swayCycles: random(1.1, 2.3),
      swayPhase: Math.random(),
    };
  });
}

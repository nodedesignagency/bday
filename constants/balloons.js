/**
 * Everything you might want to tweak about the birthday balloons lives here.
 */

// How long after the app opens before the balloons let go.
export const LAUNCH_DELAY_MS = 1000;

// Balloons in a single burst.
export const BALLOON_COUNT = 18;

// Balloon width in points. Small balloons read as "far away", big ones as "close".
const MIN_SIZE = 34;
const MAX_SIZE = 78;

// How long a balloon takes to cross the screen. Far ones drift, near ones hustle.
const SLOW_RISE_MS = 6400;
const FAST_RISE_MS = 3900;

// The burst is spread over this window so they don't all leave the ground together.
const STAGGER_MS = 2100;

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
const blend = (hex, toward, amount) =>
  `rgb(${hexToRgb(hex)
    .map((channel) => Math.round(channel + (toward - channel) * amount))
    .join(', ')})`;

const shade = (hex, amount) => blend(hex, 0, amount);

const random = (min, max) => min + Math.random() * (max - min);
const lerp = (from, to, t) => from + (to - from) * t;

/**
 * Builds one burst. Balloons are spread across columns so the screen fills
 * evenly instead of clumping wherever Math.random happens to land.
 */
export function createBalloons(width, height) {
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
      // Squaring the roll front-loads the burst: a rush first, stragglers after.
      delay: Math.random() ** 1.7 * STAGGER_MS,
      duration: lerp(SLOW_RISE_MS, FAST_RISE_MS, depth) * random(0.9, 1.1),
      // Side-to-side drift, in points, and how many full sways on the way up.
      sway: random(12, 34) * lerp(0.6, 1, depth),
      swayCycles: random(1.1, 2.3),
      phase: Math.random(),
      // Solid. Depth already reads from size and speed, and anything less than
      // opaque lets the profile text show straight through a balloon.
      opacity: 1,
      // Height of the screen is needed to know where "below the fold" is.
      travel: height,
    };
  });
}

import { StyleSheet, View } from 'react-native';

import { BURST_MS } from '../constants/balloons';

const MAX_TILT_DEG = 8;

// Tilt of each string segment, top to bottom, to curl the string.
const STRING_SEGMENTS = [0, 3, 4, 2, -2, -3, -2];

// A balloon is taller than it is wide. The body is laid out as a circle and
// stretched, because a scaled circle is a true ellipse on every platform,
// where a tall box with a big corner radius is only ever a pill.
const STRETCH = 1.18;

const lerp = (from, to, t) => from + (to - from) * t;
const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

// Slow release, floaty cruise, no hard stop at the top.
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * A single balloon, drawn from the burst's progress. Plain arithmetic and a
 * plain View: whatever the platform does with animation drivers, it can still
 * put a box where the numbers say.
 */
export default function Balloon({
  progress,
  color,
  knotColor,
  size,
  x,
  delay,
  duration,
  sway,
  swayCycles,
  phase,
  travel,
}) {
  // Stretching happens around the middle, so the body spills this far past its
  // layout box at the top and at the bottom.
  const overhang = (size * STRETCH - size) / 2;
  const knotHeight = size * 0.11;
  const stringHeight = size * 1.45;
  const totalHeight = overhang + size + overhang + knotHeight + stringHeight;

  // This balloon's own slice of the burst: parked below the screen until its
  // moment, gone above it afterwards.
  const startAt = delay / BURST_MS;
  const endAt = (delay + duration) / BURST_MS;
  const t = clamp01((progress - startAt) / (endAt - startAt));

  const translateY = lerp(travel + overhang, -totalHeight, ease(t));
  const translateX = Math.sin((phase + t * swayCycles) * Math.PI * 2) * sway;
  // Lean into the drift, so the balloon swings rather than slides.
  const tilt = (translateX / sway) * MAX_TILT_DEG;

  return (
    <View
      style={[
        styles.balloon,
        {
          left: x,
          width: size,
          transform: [{ translateY }, { translateX }, { rotate: `${tilt}deg` }],
        },
      ]}
    >
      <View
        style={[
          styles.body,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ scaleY: STRETCH }],
          },
        ]}
      >
        {/* An oversized dark disc cutting in from the right: its curved edge
            shades the balloon like a round object, where a straight-edged
            panel would just look like a stripe. */}
        <View
          style={[
            styles.shade,
            {
              width: size * 1.25,
              height: size * 1.25,
              right: -size * 0.62,
              top: -size * 0.1,
              borderRadius: size * 0.625,
            },
          ]}
        />
        <View
          style={[
            styles.highlight,
            {
              width: size * 0.22,
              height: size * 0.32,
              left: size * 0.15,
              top: size * 0.15,
              borderRadius: size / 4,
            },
          ]}
        />
        <View
          style={[
            styles.glint,
            {
              width: size * 0.09,
              height: size * 0.09,
              left: size * 0.36,
              top: size * 0.12,
              borderRadius: size * 0.045,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.knot,
          {
            marginTop: overhang - 1,
            borderLeftWidth: size * 0.07,
            borderRightWidth: size * 0.07,
            borderTopWidth: knotHeight,
            borderTopColor: knotColor,
          },
        ]}
      />

      <View style={styles.string}>
        {STRING_SEGMENTS.map((angle, index) => (
          <View
            key={`${angle}-${index}`}
            style={[
              styles.stringSegment,
              { height: stringHeight / STRING_SEGMENTS.length, transform: [{ rotate: `${angle}deg` }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  balloon: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
  },
  body: {
    overflow: 'hidden',
  },
  shade: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.36)',
    transform: [{ rotate: '-16deg' }],
  },
  glint: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  knot: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  string: {
    alignItems: 'center',
    // Fade the whole string at once. Per-segment alpha would double up at the
    // overlaps and bead the string with bright knots.
    opacity: 0.34,
  },
  stringSegment: {
    width: 2.5,
    // Generous overlap, so the tilted joints read as one continuous string.
    marginTop: -3,
    borderRadius: 1.25,
    backgroundColor: '#DCE0E6',
  },
});

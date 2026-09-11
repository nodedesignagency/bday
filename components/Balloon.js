import { useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { BURST_MS } from '../constants/balloons';

// Sample points along one balloon's flight. The rise easing, the sway and the
// tilt are all baked into these, so the shared clock can tick straight through.
const STEPS = 24;

const RISE_EASING = Easing.bezier(0.38, 0, 0.62, 1);

const MAX_TILT_DEG = 8;

// Tilt of each string segment, top to bottom, to curl the string.
const STRING_SEGMENTS = [0, 3, 4, 2, -2, -3, -2];

// A balloon is taller than it is wide. The body is laid out as a circle and
// stretched, because a scaled circle is a true ellipse on every platform,
// where a tall box with a big corner radius is only ever a pill.
const STRETCH = 1.18;

const lerp = (from, to, t) => from + (to - from) * t;

export default function Balloon({
  clock,
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

  const flight = useMemo(() => {
    const startAt = delay / BURST_MS;
    const endAt = Math.min((delay + duration) / BURST_MS, 1);

    const from = travel + overhang;
    const to = -totalHeight;

    const clockRange = [];
    const rise = [];
    const drift = [];
    const tilt = [];

    for (let step = 0; step <= STEPS; step += 1) {
      const t = step / STEPS;
      const offset = Math.sin((phase + t * swayCycles) * Math.PI * 2) * sway;

      clockRange.push(lerp(startAt, endAt, t));
      rise.push(lerp(from, to, RISE_EASING(t)));
      drift.push(offset);
      // Lean into the drift, so the balloon swings rather than slides.
      tilt.push(`${(offset / sway) * MAX_TILT_DEG}deg`);
    }

    return { clockRange, rise, drift, tilt };
  }, [delay, duration, overhang, phase, sway, swayCycles, totalHeight, travel]);

  // Clamped at both ends: parked below the screen until its moment, gone above
  // it afterwards.
  const interpolation = (outputRange) =>
    clock.interpolate({ inputRange: flight.clockRange, outputRange, extrapolate: 'clamp' });

  return (
    <Animated.View
      style={[
        styles.balloon,
        {
          left: x,
          width: size,
          transform: [
            { translateY: interpolation(flight.rise) },
            { translateX: interpolation(flight.drift) },
            { rotate: interpolation(flight.tilt) },
          ],
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
    </Animated.View>
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

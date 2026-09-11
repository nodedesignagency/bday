import { Pressable, StyleSheet, View } from 'react-native';

// How long the pop takes to play out, in ms.
export const POP_MS = 220;

const MAX_TILT_DEG = 8;

// Tilt of each string segment, top to bottom, to curl the string.
const STRING_SEGMENTS = [0, 3, 4, 2, -2, -3, -2];

// A balloon is taller than it is wide. The body is laid out as a circle and
// stretched, because a scaled circle is a true ellipse on every platform,
// where a tall box with a big corner radius is only ever a pill.
const STRETCH = 1.18;

const lerp = (from, to, t) => from + (to - from) * t;

/**
 * A single balloon.
 *
 * Where it sits is worked out from the clock on the wall and nothing else — no
 * stored progress, no start time, no animation to be interrupted. Whatever the
 * app does around it, a balloon is always exactly where the time of day says
 * it should be, so it can drift but it can never stall.
 */
export default function Balloon({ now, travel, popped, onPop, balloon }) {
  const { id, size, color, knotColor, x, cycleMs, offset, sway, swayCycles, swayPhase } = balloon;

  // Stretching happens around the middle, so the body spills this far past its
  // layout box at the top and at the bottom.
  const overhang = (size * STRETCH - size) / 2;
  const knotHeight = size * 0.11;
  const stringHeight = size * 1.45;
  const totalHeight = overhang + size + overhang + knotHeight + stringHeight;

  // Which crossing this is, and how far through it we are.
  const cycles = now / cycleMs + offset;
  const trip = Math.floor(cycles);
  const phase = cycles - trip;

  let scale = 1;
  let opacity = 1;

  if (popped && popped.trip === trip) {
    const burst = (now - popped.at) / POP_MS;

    // Popped and finished bursting: gone until it comes round again.
    if (burst >= 1) {
      return null;
    }

    scale = 1 + burst * 0.7;
    opacity = 1 - burst;
  }

  const translateY = lerp(travel + overhang, -totalHeight, phase);
  const translateX = Math.sin((swayPhase + phase * swayCycles) * Math.PI * 2) * sway;
  // Lean into the drift, so the balloon swings rather than slides.
  const tilt = (translateX / sway) * MAX_TILT_DEG;

  return (
    <Pressable
      onPress={() => onPop(id, trip)}
      style={[
        styles.balloon,
        {
          left: x,
          width: size,
          opacity,
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
            transform: [{ scaleY: STRETCH }, { scale }],
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
    </Pressable>
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

import { useMemo } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

const MAX_TILT_DEG = 8;

// Sample points for the sway, so one phase value drives drift and tilt too.
const SWAY_STEPS = 16;

// Tilt of each string segment, top to bottom, to curl the string.
const STRING_SEGMENTS = [0, 3, 4, 2, -2, -3, -2];

// A balloon is taller than it is wide. The body is laid out as a circle and
// stretched, because a scaled circle is a true ellipse on every platform,
// where a tall box with a big corner radius is only ever a pill.
const STRETCH = 1.18;

/**
 * A single balloon.
 *
 * `phase` is an Animated.Value the field keeps wound to the current time: 0 at
 * the bottom of the screen, 1 above the top. Reading it through interpolation
 * means the balloon's position is pushed straight to the view, so drifting up
 * the screen costs no React renders at all — which is what was throttling the
 * rise on a real phone while looking perfectly fine in a browser.
 */
export default function Balloon({ phase, travel, balloon, onPop }) {
  const { id, size, color, knotColor, x, sway, swayCycles, swayPhase } = balloon;

  // Stretching happens around the middle, so the body spills this far past its
  // layout box at the top and at the bottom.
  const overhang = (size * STRETCH - size) / 2;
  const knotHeight = size * 0.11;
  const stringHeight = size * 1.45;
  const totalHeight = overhang + size + overhang + knotHeight + stringHeight;

  const { steps, drift, tilt } = useMemo(() => {
    const at = [];
    const sideways = [];
    const lean = [];

    for (let step = 0; step <= SWAY_STEPS; step += 1) {
      const t = step / SWAY_STEPS;
      const offset = Math.sin((swayPhase + t * swayCycles) * Math.PI * 2) * sway;

      at.push(t);
      sideways.push(offset);
      // Lean into the drift, so the balloon swings rather than slides.
      lean.push(`${(offset / sway) * MAX_TILT_DEG}deg`);
    }

    return { steps: at, drift: sideways, tilt: lean };
  }, [sway, swayCycles, swayPhase]);

  const translateY = phase.interpolate({
    inputRange: [0, 1],
    outputRange: [travel + overhang, -totalHeight],
  });

  const translateX = phase.interpolate({ inputRange: steps, outputRange: drift });
  const rotate = phase.interpolate({ inputRange: steps, outputRange: tilt });

  return (
    <Animated.View
      style={[
        styles.balloon,
        { left: x, width: size, transform: [{ translateY }, { translateX }, { rotate }] },
      ]}
    >
      {/* Only the balloon itself is tappable. The string trailing below it is
          not, so a tap low on the screen cannot take out a balloon well above
          the finger. */}
      <Pressable onPress={() => onPop(id)} style={{ width: size, height: size }}>
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
      </Pressable>

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
    // The string is not a hit target; only the balloon above it is.
    pointerEvents: 'none',
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

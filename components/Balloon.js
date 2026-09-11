import { Pressable, StyleSheet, View } from 'react-native';

const MAX_TILT_DEG = 8;

// A balloon is taller than it is wide. The body is laid out as a circle and
// stretched, because a scaled circle is a true ellipse on every platform,
// where a tall box with a big corner radius is only ever a pill.
const STRETCH = 1.18;

const lerp = (from, to, t) => from + (to - from) * t;

/**
 * A single balloon.
 *
 * Placed with `top` and `left` rather than moved with a transform. Touch
 * hit-testing on iOS does not reliably follow a transform, so a balloon drawn
 * near the bottom of the screen kept its tap target wherever it had been laid
 * out — which is why tapping one place popped a balloon somewhere else, and
 * why they seemed to pop themselves. Laying it out where it is drawn keeps the
 * two together.
 *
 * Kept deliberately plain and few-viewed: the field re-renders these on every
 * tick, and view count is what that costs on a phone.
 */
export default function Balloon({ phase, travel, balloon, onPop }) {
  const { id, size, color, knotColor, x, sway, swayCycles, swayPhase } = balloon;

  const bodyHeight = size * STRETCH;
  const knotHeight = size * 0.11;
  const stringHeight = size * 1.45;
  const totalHeight = bodyHeight + knotHeight + stringHeight;

  const top = lerp(travel, -totalHeight, phase);
  const drift = Math.sin((swayPhase + phase * swayCycles) * Math.PI * 2) * sway;
  // Lean into the drift, so the balloon swings rather than slides.
  const tilt = (drift / sway) * MAX_TILT_DEG;

  return (
    <View
      style={[
        styles.balloon,
        { top, left: x + drift, width: size, transform: [{ rotate: `${tilt}deg` }] },
      ]}
    >
      {/* Only the balloon is tappable; the string trailing below it is not. */}
      <Pressable
        onPress={() => onPop(id)}
        // A balloon is a moving target, and a finger is not a pixel. Give the
        // tap a little room around the edges.
        hitSlop={12}
        style={[
          styles.body,
          {
            width: size,
            height: bodyHeight,
            borderRadius: size / 2,
            backgroundColor: color,
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
              height: bodyHeight * 1.25,
              right: -size * 0.62,
              top: -bodyHeight * 0.1,
              borderRadius: size * 0.625,
            },
          ]}
        />
        <View
          style={[
            styles.highlight,
            {
              width: size * 0.22,
              height: bodyHeight * 0.28,
              left: size * 0.15,
              top: bodyHeight * 0.14,
              borderRadius: size / 4,
            },
          ]}
        />
      </Pressable>

      <View
        style={[
          styles.knot,
          {
            borderLeftWidth: size * 0.07,
            borderRightWidth: size * 0.07,
            borderTopWidth: knotHeight,
            borderTopColor: knotColor,
          },
        ]}
      />

      <View style={[styles.string, { height: stringHeight }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  balloon: {
    position: 'absolute',
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
  knot: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  string: {
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    pointerEvents: 'none',
  },
});

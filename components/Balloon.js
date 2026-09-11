import { memo, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { STRETCH, balloonAt } from '../constants/balloons';

// Sample points along one rise. The sway and tilt are curves, so they are
// handed to the interpolation as a table rather than computed per frame.
const STEPS = 20;

/**
 * A single balloon.
 *
 * `phase` is an Animated.Value looping 0 to 1 on the UI thread, so the balloon
 * moves without JavaScript running at all — no render per frame, nothing for
 * the app to keep up with. It re-renders only when it is popped.
 */
function Balloon({ balloon, phase, travel, hidden }) {
  const { size, color, knotColor } = balloon;

  const bodyHeight = size * STRETCH;
  const knotHeight = size * 0.11;
  const stringHeight = size * 1.45;

  const curve = useMemo(() => {
    const at = [];
    const drift = [];
    const tilt = [];

    for (let step = 0; step <= STEPS; step += 1) {
      const t = step / STEPS;
      const place = balloonAt(balloon, t, travel);

      at.push(t);
      drift.push(place.drift);
      tilt.push(`${place.tilt}deg`);
    }

    return { at, drift, tilt };
  }, [balloon, travel]);

  const translateY = phase.interpolate({
    inputRange: [0, 1],
    outputRange: [balloonAt(balloon, 0, travel).top, balloonAt(balloon, 1, travel).top],
  });

  return (
    <Animated.View
      style={[
        styles.balloon,
        {
          left: balloon.x,
          width: size,
          // Popped balloons stay mounted and merely stop being visible. Taking
          // one out of the tree is a way for it to vanish by accident.
          opacity: hidden ? 0 : 1,
          transform: [
            { translateY },
            { translateX: phase.interpolate({ inputRange: curve.at, outputRange: curve.drift }) },
            { rotate: phase.interpolate({ inputRange: curve.at, outputRange: curve.tilt }) },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.body,
          { width: size, height: bodyHeight, borderRadius: size / 2, backgroundColor: color },
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
      </View>

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
    </Animated.View>
  );
}

export default memo(Balloon);

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
  },
});

import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

// More steps = smoother sway. Animated interpolates linearly between them.
const SWAY_STEPS = 16;

// Tilt of each string segment, top to bottom, to curl the string.
const STRING_SEGMENTS = [0, 3, 4, 2, -2, -3, -2];

const MAX_TILT_DEG = 8;

// A balloon is taller than it is wide. The body is laid out as a circle and
// stretched, because a scaled circle is a true ellipse on every platform,
// where a tall box with a big corner radius is only ever a pill.
const STRETCH = 1.18;

export default function Balloon({
  color,
  knotColor,
  size,
  x,
  delay,
  duration,
  sway,
  swayCycles,
  phase,
  opacity,
  travel,
}) {
  const progress = useRef(new Animated.Value(0)).current;

  // Stretching happens around the middle, so the body spills this far past its
  // layout box at the top and at the bottom.
  const overhang = (size * STRETCH - size) / 2;
  const knotHeight = size * 0.11;
  const stringHeight = size * 1.45;
  const totalHeight = overhang + size + overhang + knotHeight + stringHeight;

  // Every value this depends on is rolled once by the field and stays put, so
  // this runs at mount and is never restarted mid-rise.
  useEffect(() => {
    const rise = Animated.timing(progress, {
      toValue: 1,
      delay,
      duration,
      // Slow release, floaty cruise, no hard stop at the top.
      easing: Easing.bezier(0.38, 0, 0.62, 1),
      // Driven from JS on purpose. The native driver hands the animation to a
      // view the platform owns, and a rise that stalls halfway up is the price
      // when that goes wrong. Eighteen balloons is nothing to drive by hand.
      useNativeDriver: false,
    });

    rise.start();
    return () => rise.stop();
  }, [delay, duration, progress]);

  // A sine wave sampled into interpolation points: drift left, right, left...
  const { inputRange, swayRange, tiltRange } = useMemo(() => {
    const input = [];
    const drift = [];

    for (let step = 0; step <= SWAY_STEPS; step += 1) {
      const t = step / SWAY_STEPS;
      input.push(t);
      drift.push(Math.sin((phase + t * swayCycles) * Math.PI * 2) * sway);
    }

    return {
      inputRange: input,
      swayRange: drift,
      // Lean into the drift, so the balloon swings rather than slides.
      tiltRange: drift.map((offset) => `${(offset / sway) * MAX_TILT_DEG}deg`),
    };
  }, [phase, sway, swayCycles]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [travel + overhang, -totalHeight],
  });

  const translateX = progress.interpolate({ inputRange, outputRange: swayRange });
  const rotate = progress.interpolate({ inputRange, outputRange: tiltRange });

  return (
    <Animated.View
      style={[
        styles.balloon,
        {
          left: x,
          width: size,
          // Fixed rather than animated: a balloon that fails to move is still a
          // balloon you can see, instead of an invisible bug.
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
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

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

// More steps = smoother sway. Animated interpolates linearly between them.
const SWAY_STEPS = 16;

// Tilt of each string segment, top to bottom, to curl the string.
const STRING_SEGMENTS = [0, 3, 4, 2, -2, -3, -2];

const MAX_TILT_DEG = 8;

export default function Balloon({
  gradient,
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

  const bodyHeight = size * 1.18;
  const knotHeight = size * 0.11;
  const stringHeight = size * 1.45;
  const totalHeight = bodyHeight + knotHeight + stringHeight;

  useEffect(() => {
    const rise = Animated.timing(progress, {
      toValue: 1,
      delay,
      duration,
      // Slow release, floaty cruise, no hard stop at the top.
      easing: Easing.bezier(0.38, 0, 0.62, 1),
      useNativeDriver: true,
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
    outputRange: [travel + size, -totalHeight - 24],
  });

  const translateX = progress.interpolate({ inputRange, outputRange: swayRange });
  const rotate = progress.interpolate({ inputRange, outputRange: tiltRange });

  const fadeIn = progress.interpolate({
    inputRange: [0, 0.04, 1],
    outputRange: [0, opacity, opacity],
  });

  return (
    <Animated.View
      style={[
        styles.balloon,
        {
          left: x,
          width: size,
          opacity: fadeIn,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    >
      <LinearGradient
        colors={gradient}
        locations={[0, 0.45, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={[styles.body, { width: size, height: bodyHeight }]}
      >
        {/* A soft streak and a pinpoint glint: the bit that sells "latex". */}
        <View
          style={[
            styles.highlight,
            {
              width: size * 0.2,
              height: bodyHeight * 0.32,
              left: size * 0.16,
              top: bodyHeight * 0.15,
            },
          ]}
        />
        <View
          style={[
            styles.glint,
            { width: size * 0.09, height: size * 0.09, left: size * 0.35, top: bodyHeight * 0.11 },
          ]}
        />
      </LinearGradient>

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
    // Swing from the balloon itself, the way a real one drags its string along.
    transformOrigin: 'top center',
  },
  body: {
    // A true ellipse, not a rounded rectangle.
    borderRadius: '50%',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    transform: [{ rotate: '-16deg' }],
  },
  glint: {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  knot: {
    width: 0,
    height: 0,
    marginTop: -2,
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

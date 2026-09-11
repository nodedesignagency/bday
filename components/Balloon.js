import { StyleSheet, View } from 'react-native';

/**
 * A single balloon. Purely something to look at: where it goes is decided by
 * the field, which uses the same figures to decide what a tap landed on.
 */
export default function Balloon({ balloon, place, hidden }) {
  const { size, color, knotColor } = balloon;
  const { top, left, bodyHeight, tilt } = place;

  const knotHeight = size * 0.11;
  const stringHeight = size * 1.45;

  return (
    <View
      style={[
        styles.balloon,
        {
          top,
          left,
          width: size,
          // Popped balloons stay mounted and merely stop being visible. Taking
          // them out of the tree is a way for one to vanish by accident.
          opacity: hidden ? 0 : 1,
          transform: [{ rotate: `${tilt}deg` }],
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
  },
});

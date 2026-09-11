import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { createBalloons, placeBalloon } from '../constants/balloons';
import Balloon from './Balloon';

// 30 a second. Every tick re-renders the balloons, and a render is what costs
// on a phone, so this buys back half of it for motion nobody can tell apart.
const TICK_MS = 33;

// How long a popped balloon stays gone before a fresh one rises in its place.
const RESPAWN_MS = 1400;

// A finger is not a pixel, and a balloon is a moving target.
const TAP_SLOP = 14;

/**
 * Held outside React so a rebuilt tree gets the same balloons back rather than
 * a fresh set in new columns and colours.
 */
let cached = null;

/**
 * The balloons, drifting up the screen for as long as the app is open.
 *
 * There is one touch handler, on the field, and it works out what was hit from
 * the very same figures that placed the balloons on screen. Giving each balloon
 * its own tappable view is what made them appear to pop themselves: a tap would
 * land on a balloon nowhere near the finger, and every balloon it reached
 * disappeared a moment after coming into view.
 */
export default function BalloonField() {
  const { width, height } = useWindowDimensions();
  const [now, setNow] = useState(() => Date.now());

  const [balloons] = useState(() => {
    if (!cached) {
      cached = createBalloons(width);
    }

    return cached;
  });

  // id -> when it was popped. A balloon is hidden while that is recent, which
  // means the clock alone decides, and a lost timer cannot strand one.
  const [poppedAt, setPoppedAt] = useState(() => ({}));
  const nowRef = useRef(now);

  useEffect(() => {
    const ticker = setInterval(() => {
      const stamp = Date.now();
      nowRef.current = stamp;
      setNow(stamp);
    }, TICK_MS);

    return () => clearInterval(ticker);
  }, []);

  const handleTap = useCallback(
    (touchX, touchY) => {
      const stamp = nowRef.current;

      const hit = balloons
        .filter((balloon) => stamp - (poppedAt[balloon.id] || 0) >= RESPAWN_MS)
        .map((balloon) => ({ balloon, place: placeBalloon(balloon, stamp, height) }))
        .filter(
          ({ balloon, place }) =>
            touchX >= place.left - TAP_SLOP &&
            touchX <= place.left + balloon.size + TAP_SLOP &&
            touchY >= place.top - TAP_SLOP &&
            touchY <= place.top + place.bodyHeight + TAP_SLOP,
        )
        // Overlapping balloons: the nearest one is the one you meant.
        .sort((a, b) => b.balloon.size - a.balloon.size)[0];

      if (!hit) {
        return;
      }

      setPoppedAt((current) => ({ ...current, [hit.balloon.id]: stamp }));

      setTimeout(() => {
        // Send the replacement up from the bottom rather than dropping it back
        // in wherever its old cycle had wandered to.
        hit.balloon.offset = -Date.now() / hit.balloon.cycleMs;
      }, RESPAWN_MS);
    },
    [balloons, height, poppedAt],
  );

  return (
    <View
      style={styles.field}
      onStartShouldSetResponder={() => true}
      onResponderRelease={(event) =>
        handleTap(event.nativeEvent.locationX, event.nativeEvent.locationY)
      }
    >
      {balloons.map((balloon) => (
        <Balloon
          key={balloon.id}
          balloon={balloon}
          place={placeBalloon(balloon, now, height)}
          hidden={now - (poppedAt[balloon.id] || 0) < RESPAWN_MS}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: StyleSheet.absoluteFillObject,
});

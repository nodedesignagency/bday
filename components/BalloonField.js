import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';

import { balloonAt, createBalloons } from '../constants/balloons';
import { FILL } from '../constants/fill';
import Balloon from './Balloon';

// How long a popped balloon stays gone before a fresh one rises in its place.
const RESPAWN_MS = 1400;

// A finger is not a pixel, and a balloon is a moving target.
const TAP_SLOP = 16;

// What counts as a tap rather than a drag or a stray touch: short, and it has
// to end roughly where it started, on the balloon it started on.
const TAP_MS = 600;
const TAP_DRIFT = 14;

/**
 * Held outside React so a rebuilt tree gets the same balloons back rather than
 * a fresh set in new columns and colours.
 */
let cached = null;

// Balloons enter over this window rather than all at once. Their differing
// speeds pull them apart from there.
const STAGGER_MS = 5000;

/**
 * One lap up the screen, which starts the next when it lands.
 *
 * Deliberately not Animated.loop: that leaves every balloon parked above the
 * top of the screen after a single lap. A plain timing does run, and the
 * handful of lines of JavaScript between laps — once every few seconds per
 * balloon — cost nothing. Everything in between is driven natively, with no
 * JavaScript per frame and nothing re-rendering, which is what makes this
 * light where redrawing from JavaScript was heavy.
 */
function startRise(rise, cycleMs) {
  rise.value.setValue(0);
  rise.startedAt = Date.now();

  rise.lap = Animated.timing(rise.value, {
    toValue: 1,
    duration: cycleMs,
    easing: Easing.linear,
    useNativeDriver: true,
  });

  rise.lap.start(({ finished }) => {
    if (finished && !rise.stopped) {
      startRise(rise, cycleMs);
    }
  });
}

/**
 * The balloons, drifting up the screen for as long as the app is open.
 *
 * Each rise is declared once and runs natively, so no JavaScript executes
 * between frames and nothing re-renders while they move. That is what makes it
 * light: the previous versions redrew every balloon from JavaScript sixty
 * times a second, which a browser shrugs off and a phone does not.
 *
 * Taps are worked out here, from the same figures that place the balloons,
 * rather than by giving each balloon its own tappable view. Those views move
 * every frame, and anything that reached one popped it — which is why balloons
 * appeared to pop themselves and never got far off the bottom.
 */
export default function BalloonField() {
  const { width, height } = useWindowDimensions();

  const [balloons] = useState(() => {
    if (!cached) {
      cached = createBalloons(width);
    }

    return cached;
  });

  // Per-balloon: the value the native side drives, plus enough to work out
  // where it is right now without asking the native side anything.
  const rises = useRef(
    balloons.map((balloon) => ({
      value: new Animated.Value(0),
      // Restamped at the top of every lap, so a tap can work out where the
      // balloon is without asking the native side anything.
      startedAt: Date.now() + balloon.offset * STAGGER_MS,
      delayMs: balloon.offset * STAGGER_MS,
    })),
  ).current;

  const [popped, setPopped] = useState(() => ({}));

  useEffect(() => {
    const timers = rises.map((rise, index) => {
      rise.stopped = false;
      return setTimeout(() => startRise(rise, balloons[index].cycleMs), rise.delayMs);
    });

    return () => {
      timers.forEach(clearTimeout);
      rises.forEach((rise) => {
        rise.stopped = true;
        if (rise.lap) {
          rise.lap.stop();
        }
      });
    };
  }, [balloons, rises]);

  const phaseOf = useCallback(
    (index, at) => {
      const rise = rises[index];
      const elapsed = at - rise.startedAt;

      if (elapsed <= 0) {
        return 0;
      }

      return Math.min(elapsed / balloons[index].cycleMs, 1);
    },
    [balloons, rises],
  );

  // Which balloon is under a point, if any. Worked out from the same figures
  // that place them, so what you can hit is what you can see.
  const balloonUnder = useCallback(
    (touchX, touchY) => {
      const at = Date.now();

      return balloons
        .map((balloon, index) => ({ balloon, index, place: balloonAt(balloon, phaseOf(index, at), height) }))
        .filter(({ balloon }) => !popped[balloon.id])
        .filter(
          ({ balloon, place }) =>
            touchX >= place.left - TAP_SLOP &&
            touchX <= place.left + balloon.size + TAP_SLOP &&
            touchY >= place.top - TAP_SLOP &&
            touchY <= place.top + place.bodyHeight + TAP_SLOP,
        )
        // Overlapping balloons: the nearest one is the one you meant.
        .sort((a, b) => b.balloon.size - a.balloon.size)[0];
    },
    [balloons, height, phaseOf, popped],
  );

  const handleTap = useCallback(
    (touchX, touchY) => {
      const hit = balloonUnder(touchX, touchY);

      if (!hit) {
        return;
      }

      setPopped((current) => ({ ...current, [hit.balloon.id]: true }));

      setTimeout(() => {
        setPopped((current) => {
          const next = { ...current };
          delete next[hit.balloon.id];
          return next;
        });
      }, RESPAWN_MS);
    },
    [balloonUnder],
  );

  // A tap in progress: which balloon it started on, where, and when.
  const pending = useRef(null);

  return (
    <View
      style={styles.field}
      // Only take the touch if it actually began on a balloon. Anywhere else
      // and this never hears about it, so it cannot pop anything.
      onStartShouldSetResponder={(event) => {
        const { locationX, locationY } = event.nativeEvent;
        const hit = balloonUnder(locationX, locationY);

        if (!hit) {
          pending.current = null;
          return false;
        }

        pending.current = { id: hit.balloon.id, x: locationX, y: locationY, at: Date.now() };
        return true;
      }}
      onResponderRelease={(event) => {
        const start = pending.current;
        pending.current = null;

        if (!start) {
          return;
        }

        const { locationX, locationY } = event.nativeEvent;
        const held = Date.now() - start.at;
        const moved = Math.hypot(locationX - start.x, locationY - start.y);

        // A real tap: brief, barely moved, and still on the balloon it began
        // on. Anything else is a drag, a stray touch, or a different balloon
        // drifting under the finger — and none of those should pop one.
        if (held > TAP_MS || moved > TAP_DRIFT) {
          return;
        }

        const hit = balloonUnder(locationX, locationY);

        if (hit && hit.balloon.id === start.id) {
          handleTap(locationX, locationY);
        }
      }}
      onResponderTerminate={() => {
        pending.current = null;
      }}
    >
      {balloons.map((balloon, index) => (
        <Balloon
          key={balloon.id}
          balloon={balloon}
          phase={rises[index].value}
          travel={height}
          hidden={Boolean(popped[balloon.id])}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: FILL,
});

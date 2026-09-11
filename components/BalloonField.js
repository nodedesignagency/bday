import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';

import { createBalloons } from '../constants/balloons';
import Balloon from './Balloon';

// How long a popped balloon stays gone before a new one drifts up in its place.
const RESPAWN_MS = 1600;

const TICK_MS = 16;

/**
 * Held outside React so a rebuilt tree gets the same balloons back rather than
 * a fresh set in new columns and colours.
 */
let cached = null;

/**
 * The balloons, drifting up the screen for as long as the app is open.
 *
 * The tick winds each balloon's phase straight to its Animated value, which
 * pushes the new position at the view without re-rendering anything. That is
 * the whole trick: a React render per frame is cheap in a browser and costs a
 * fresh view tree on a phone, which is what kept the rise crawling.
 *
 * Phase is worked out from the time of day, so nothing accumulates and there
 * is no progress for a rebuild to lose.
 *
 * Deliberately no `overflow: hidden`: balloons begin below the bottom of the
 * screen, and clipping a layer on iOS can detach the children sitting outside
 * it. The screen edge does the clipping for free.
 */
export default function BalloonField() {
  const { width, height: windowHeight } = useWindowDimensions();

  // Measured rather than assumed, so the balloons always leave from the real
  // bottom edge of what is on screen.
  const [travel, setTravel] = useState(windowHeight);

  const [balloons] = useState(() => {
    if (!cached) {
      cached = createBalloons(width);
    }

    return cached;
  });

  // One value per balloon: 0 at the bottom edge, 1 above the top.
  const phases = useRef(balloons.map(() => new Animated.Value(0))).current;

  // Popped balloons, by id. Changes only when one is tapped.
  const [popped, setPopped] = useState(() => new Set());

  useEffect(() => {
    const ticker = setInterval(() => {
      const now = Date.now();

      for (let index = 0; index < balloons.length; index += 1) {
        const { cycleMs, offset } = balloons[index];
        const cycles = now / cycleMs + offset;
        phases[index].setValue(cycles - Math.floor(cycles));
      }
    }, TICK_MS);

    return () => clearInterval(ticker);
  }, [balloons, phases]);

  const pop = useCallback(
    (id) => {
      setPopped((current) => {
        if (current.has(id)) {
          return current;
        }

        const next = new Set(current);
        next.add(id);
        return next;
      });

      setTimeout(() => {
        const balloon = balloons.find((candidate) => candidate.id === id);

        // Send the replacement up from the bottom rather than dropping it back
        // in wherever its old cycle had wandered to.
        if (balloon) {
          balloon.offset = -Date.now() / balloon.cycleMs;
        }

        setPopped((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }, RESPAWN_MS);
    },
    [balloons],
  );

  return (
    <View
      style={styles.field}
      onLayout={(event) => setTravel(event.nativeEvent.layout.height)}
    >
      {balloons.map((balloon, index) =>
        popped.has(balloon.id) ? null : (
          <Balloon
            key={balloon.id}
            balloon={balloon}
            phase={phases[index]}
            travel={travel}
            onPop={pop}
          />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: StyleSheet.absoluteFillObject,
});

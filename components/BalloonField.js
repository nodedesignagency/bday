import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { createBalloons } from '../constants/balloons';
import Balloon from './Balloon';

// 30 a second. Every tick re-renders the balloons, and a render is the thing
// that costs on a phone, so this buys back half of it for motion nobody can
// tell apart from 60.
const TICK_MS = 33;

// How long a popped balloon stays gone before a fresh one rises in its place.
const RESPAWN_MS = 1400;

/**
 * Held outside React so a rebuilt tree gets the same balloons back rather than
 * a fresh set in new columns and colours.
 */
let cached = null;

/**
 * The balloons, drifting up the screen for as long as the app is open.
 *
 * Each tick republishes the time and every balloon works out where it belongs
 * from that alone — nothing accumulates, so there is no progress for a rebuild
 * to lose and nothing that can end up stalled halfway.
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

  // Popped balloons, by id. Changes only when one is tapped.
  const [popped, setPopped] = useState(() => new Set());

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(ticker);
  }, []);

  const pop = useCallback(
    (id) => {
      setPopped((current) => {
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
    <View style={styles.field}>
      {balloons.map((balloon) => {
        if (popped.has(balloon.id)) {
          return null;
        }

        const cycles = now / balloon.cycleMs + balloon.offset;

        return (
          <Balloon
            key={balloon.id}
            balloon={balloon}
            phase={cycles - Math.floor(cycles)}
            travel={height}
            onPop={pop}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: StyleSheet.absoluteFillObject,
});

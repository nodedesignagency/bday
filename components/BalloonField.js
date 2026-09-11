import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { createBalloons } from '../constants/balloons';
import Balloon from './Balloon';

/**
 * Held outside React so a rebuilt tree gets the same balloons back. Their
 * positions come from the clock either way, so this is only to stop them
 * jumping to new columns and colours if the app rebuilds underneath them.
 */
let cached = null;

// ~60 ticks a second, only to keep the clock fresh. Nothing accumulates here,
// so a late tick costs a frame of smoothness and nothing else.
const TICK_MS = 16;

/**
 * The balloons, drifting up the screen for as long as the app is open.
 *
 * Tick just republishes the current time; every balloon works out where it
 * belongs from that. There is no progress to lose, which is the whole point —
 * a rebuilt tree picks straight back up instead of dropping to the floor.
 *
 * Deliberately no `overflow: hidden`: balloons begin their rise below the
 * bottom of the screen, and clipping a layer on iOS can detach the children
 * sitting outside it — which takes the whole lot with it. The screen edge does
 * the clipping for free.
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

  // id -> which crossing it was popped on, and when.
  const [popped, setPopped] = useState({});

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(ticker);
  }, []);

  const pop = useCallback((id, trip) => {
    setPopped((current) => ({ ...current, [id]: { trip, at: Date.now() } }));
  }, []);

  return (
    <View style={styles.field}>
      {balloons.map((balloon) => (
        <Balloon
          key={balloon.id}
          balloon={balloon}
          now={now}
          travel={height}
          popped={popped[balloon.id]}
          onPop={pop}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: StyleSheet.absoluteFillObject,
});

import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { BURST_MS, createBalloons } from '../constants/balloons';
import Balloon from './Balloon';

// ~60 ticks a second. Position comes from the wall clock, not from counting
// ticks, so a slow tick costs smoothness and never progress.
const TICK_MS = 16;

/**
 * One burst of balloons. Mount it with a fresh `key` to run the burst again.
 *
 * The burst is a plain number counting 0 to 1 on a timer, and every balloon is
 * drawn from it. No Animated, no interpolation, no animation driver: those are
 * the pieces that kept stalling the rise partway up on iOS, and a timer plus a
 * re-render is the one path that is certain to work. Eighteen small views is
 * well within what that can carry.
 *
 * Deliberately no `overflow: hidden`: balloons begin their rise below the
 * bottom of the screen, and clipping a layer on iOS can detach the children
 * sitting outside it — which takes the whole burst with it. The screen edge
 * does the clipping for free.
 */
export default function BalloonField() {
  const { width, height } = useWindowDimensions();
  const [progress, setProgress] = useState(0);

  // Rolled once, at mount. A replay gets fresh balloons because the whole field
  // remounts on a new key.
  const [balloons] = useState(() => createBalloons(width, height));

  useEffect(() => {
    const startedAt = Date.now();

    const ticker = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / BURST_MS;

      if (elapsed >= 1) {
        setProgress(1);
        clearInterval(ticker);
        return;
      }

      setProgress(elapsed);
    }, TICK_MS);

    return () => clearInterval(ticker);
  }, []);

  return (
    // Taps belong to the screen underneath, so a tap anywhere replays the burst.
    <View style={styles.field} pointerEvents="none">
      {balloons.map((balloon) => (
        <Balloon key={balloon.id} {...balloon} progress={progress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: StyleSheet.absoluteFillObject,
});

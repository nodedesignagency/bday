import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { BURST_MS, createBalloons } from '../constants/balloons';
import Balloon from './Balloon';

// ~60 ticks a second. Position comes from the wall clock, not from counting
// ticks, so a slow tick costs smoothness and never progress.
const TICK_MS = 16;

/**
 * The burst in flight, parked outside React on purpose.
 *
 * Everything about the rise was correct — the balloons are only ever visible
 * once it is under way — and it still never got off the bottom of the screen,
 * because the tree kept being torn down and rebuilt underneath it and each
 * rebuild started the burst again from nothing. Holding the start time out
 * here means a remount picks the burst up where it actually is rather than
 * dropping it back to the ground.
 */
let inFlight = null;

/**
 * One burst of balloons. Bump `runId` to send up a fresh one.
 *
 * Deliberately no `overflow: hidden`: balloons begin their rise below the
 * bottom of the screen, and clipping a layer on iOS can detach the children
 * sitting outside it — which takes the whole burst with it. The screen edge
 * does the clipping for free.
 */
export default function BalloonField({ runId }) {
  const { width, height } = useWindowDimensions();
  const [progress, setProgress] = useState(0);

  const [burst] = useState(() => {
    const now = Date.now();

    // Same burst, still going: carry on with it rather than start over.
    if (inFlight && inFlight.runId === runId && now - inFlight.startedAt < BURST_MS) {
      return inFlight;
    }

    inFlight = { runId, startedAt: now, balloons: createBalloons(width, height) };
    return inFlight;
  });

  useEffect(() => {
    const ticker = setInterval(() => {
      const elapsed = (Date.now() - burst.startedAt) / BURST_MS;

      if (elapsed >= 1) {
        setProgress(1);
        clearInterval(ticker);
        return;
      }

      setProgress(elapsed);
    }, TICK_MS);

    return () => clearInterval(ticker);
  }, [burst]);

  return (
    // Taps belong to the screen underneath, so a tap anywhere replays the burst.
    <View style={styles.field} pointerEvents="none">
      {burst.balloons.map((balloon) => (
        <Balloon key={balloon.id} {...balloon} progress={progress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: StyleSheet.absoluteFillObject,
});

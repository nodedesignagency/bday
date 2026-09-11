import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';

import { BURST_MS, createBalloons } from '../constants/balloons';
import Balloon from './Balloon';

/**
 * One burst of balloons. Mount it with a fresh `key` to run the burst again.
 *
 * The whole burst runs off this single clock, ticking 0 to 1 once. Each balloon
 * reads its own slice of it, so there is exactly one animation to go wrong
 * instead of eighteen, and nothing a re-render does can restart a rise midway.
 *
 * Deliberately no `overflow: hidden`: balloons begin their rise below the
 * bottom of the screen, and clipping a layer on iOS can detach the children
 * sitting outside it — which takes the whole burst with it. The screen edge
 * does the clipping for free.
 */
export default function BalloonField() {
  const { width, height } = useWindowDimensions();
  const clock = useRef(new Animated.Value(0)).current;

  // Rolled once, at mount. A replay gets fresh balloons because the whole field
  // remounts on a new key.
  const [balloons] = useState(() => createBalloons(width, height));

  // Hand-wound rather than Animated.timing. This is the same loop timing would
  // run underneath, minus the driver and scheduler that were stalling the rise
  // partway up on iOS — and it reads the wall clock each frame, so a dropped
  // frame costs smoothness rather than putting the burst behind.
  useEffect(() => {
    const startedAt = Date.now();
    let frame;

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / BURST_MS;
      clock.setValue(Math.min(elapsed, 1));

      if (elapsed < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clock]);

  return (
    // Taps belong to the screen underneath, so a tap anywhere replays the burst.
    <View style={styles.field} pointerEvents="none">
      {balloons.map((balloon) => (
        <Balloon key={balloon.id} {...balloon} clock={clock} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: StyleSheet.absoluteFillObject,
});

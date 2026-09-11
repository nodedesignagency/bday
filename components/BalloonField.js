import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { createBalloons } from '../constants/balloons';
import Balloon from './Balloon';

/**
 * One burst of balloons. Mount it with a fresh `key` to run the burst again.
 *
 * Deliberately no `overflow: hidden`: balloons begin their rise below the
 * bottom of the screen, and clipping a layer on iOS can detach the children
 * sitting outside it — which takes the whole burst with it. The screen edge
 * does the clipping for free.
 */
export default function BalloonField() {
  const { width, height } = useWindowDimensions();

  // Rolled once, at mount, and never again. useMemo would be wrong twice over:
  // React is free to discard a memo and recompute it, and the window dimensions
  // it would key on genuinely change on iOS as the hidden status bar settles.
  // Either way every balloon draws a fresh random delay and its rise restarts
  // from wherever it had got to, which reads as balloons stuck near the bottom.
  // Replays get fresh balloons because the whole field remounts on a new key.
  const [balloons] = useState(() => createBalloons(width, height));

  return (
    // Taps belong to the screen underneath, so a tap anywhere replays the burst.
    <View style={styles.field} pointerEvents="none">
      {balloons.map((balloon) => (
        <Balloon key={balloon.id} {...balloon} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: StyleSheet.absoluteFillObject,
});

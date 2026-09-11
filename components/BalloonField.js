import { useMemo } from 'react';
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
  const balloons = useMemo(() => createBalloons(width, height), [width, height]);

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

import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { createBalloons } from '../constants/balloons';
import Balloon from './Balloon';

/**
 * One burst of balloons. Mount it with a fresh `key` to run the burst again.
 */
export default function BalloonField() {
  const { width, height } = useWindowDimensions();
  const balloons = useMemo(() => createBalloons(width, height), [width, height]);

  return (
    <View style={styles.field}>
      {balloons.map((balloon) => (
        <Balloon key={balloon.id} {...balloon} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    // Taps belong to the screen underneath, so a tap anywhere replays the burst.
    pointerEvents: 'none',
  },
});

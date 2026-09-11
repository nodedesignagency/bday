import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import BalloonField from './components/BalloonField';
import BACKGROUND from './constants/background';
import { FILL } from './constants/fill';
import { LAUNCH_DELAY_MS } from './constants/balloons';

export default function App() {
  const [balloonsUp, setBalloonsUp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBalloonsUp(true), LAUNCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // The screenshot and the balloons are plain siblings: later sibling paints on
  // top, on every platform, with no z-index to get wrong.
  return (
    <View style={styles.screen}>
      <Image source={BACKGROUND} style={styles.background} resizeMode="cover" />
      {balloonsUp && <BalloonField />}
      {/* The background screenshot has its own status bar in it; hide the real one. */}
      <StatusBar hidden />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    ...FILL,
    // Explicit dimensions as well: the image's own intrinsic size otherwise
    // wins and the screenshot renders zoomed instead of fitted.
    width: '100%',
    height: '100%',
  },
});

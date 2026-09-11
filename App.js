import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet } from 'react-native';

import BalloonField from './components/BalloonField';
import BACKGROUND from './constants/background';
import { LAUNCH_DELAY_MS } from './constants/balloons';

export default function App() {
  // null = nothing in the air yet. The number keys the burst, so bumping it replays.
  const [burst, setBurst] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setBurst(0), LAUNCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const replay = useCallback(() => setBurst((current) => (current === null ? 0 : current + 1)), []);

  return (
    <Pressable style={styles.screen} onPress={replay}>
      <ImageBackground source={BACKGROUND} style={styles.background} resizeMode="cover">
        {burst !== null && <BalloonField key={burst} />}
      </ImageBackground>
      {/* The background screenshot has its own status bar in it; hide the real one. */}
      <StatusBar hidden />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    // Explicit dimensions rather than flex: the image's own intrinsic size
    // otherwise wins and the screenshot renders zoomed instead of fitted.
    width: '100%',
    height: '100%',
  },
});

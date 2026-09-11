import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';

import BalloonField from './components/BalloonField';
import BACKGROUND from './constants/background';
import { LAUNCH_DELAY_MS } from './constants/balloons';

// If the image load never reports back, launch anyway rather than sit there empty.
const SAFETY_NET_MS = 2500;

export default function App() {
  // The screenshot has to be on screen before the countdown starts, otherwise
  // the balloons launch behind the loading screen and you miss the start.
  const [onScreen, setOnScreen] = useState(false);

  // null = nothing in the air yet. The number keys the burst, so bumping it replays.
  const [burst, setBurst] = useState(null);

  useEffect(() => {
    const safetyNet = setTimeout(() => setOnScreen(true), SAFETY_NET_MS);
    return () => clearTimeout(safetyNet);
  }, []);

  useEffect(() => {
    if (!onScreen) {
      return undefined;
    }

    const timer = setTimeout(() => setBurst((current) => current ?? 0), LAUNCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onScreen]);

  const replay = useCallback(() => setBurst((current) => (current === null ? 0 : current + 1)), []);

  // The screenshot and the balloons are plain siblings rather than an
  // ImageBackground: later sibling paints on top, on every platform, with no
  // z-index to get wrong.
  return (
    <Pressable style={styles.screen} onPress={replay}>
      <Image
        source={BACKGROUND}
        style={styles.background}
        resizeMode="cover"
        onLoadEnd={() => setOnScreen(true)}
      />
      {burst !== null && <BalloonField key={burst} runId={burst} />}
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
    ...StyleSheet.absoluteFillObject,
    // Explicit dimensions as well: the image's own intrinsic size otherwise
    // wins and the screenshot renders zoomed instead of fitted.
    width: '100%',
    height: '100%',
  },
});

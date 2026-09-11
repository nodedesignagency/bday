# Happy Birthday 🎈

A one-screen Expo app: your profile screenshot as the background, and a burst of
balloons that lets go one second after the app opens.

Built because X forgot the balloons.

## Run it in Expo Go

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android: the in-app scanner, iOS: the Camera app).

## Use your own screenshot

`assets/bg.jpg` is the screenshot on screen. Replace it — same filename, same
folder — and reload the app. That's the whole step; no code to edit. To keep a
different filename, point `constants/background.js` at it instead.

The image is drawn with `resizeMode="cover"`, so a screenshot taken on the phone
you're testing on lines up edge to edge.

**Send the screenshot to yourself uncompressed.** Chat apps downscale images by
default, and an upscaled screenshot has visibly soft text — which is the one
thing that gives the joke away.

## Recording the video

- The balloons launch **1 second** after the app opens, and the burst plays out over about 9 seconds.
- **Tap anywhere** to send up a fresh burst — handy for getting a clean take.
- The device status bar is hidden, so the one baked into your screenshot is the only one on screen.

## Tweaking the balloons

Everything lives at the top of `constants/balloons.js`:

| What | Constant |
| --- | --- |
| Delay before launch | `LAUNCH_DELAY_MS` |
| How many balloons | `BALLOON_COUNT` |
| Balloon colors | `COLORS` |
| Size, speed and stagger | `MIN_SIZE` / `MAX_SIZE`, `SLOW_RISE_MS` / `FAST_RISE_MS`, `STAGGER_MS` |

Each balloon gets a random depth: small ones rise slowly and sit back, big ones
come in fast and bright, and everything sways on its own sine wave.

## Files

```
App.js                     screen: background + the burst, tap to replay
components/BalloonField.js one burst — remount with a new key to replay
components/Balloon.js      a single balloon: rise, sway, tilt, string
constants/balloons.js      all the tunables
constants/background.js    which image sits behind everything
```

## Browser preview

`npm run web` renders the same screen in a browser. Useful for checking the
animation quickly; Expo Go is the real thing.

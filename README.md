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

- The balloons start **1 second** after the app opens and keep floating up for as long as it stays open.
- **Tap a balloon to pop it.** It comes back on its next trip up, so you can keep popping.
- The device status bar is hidden, so the one baked into your screenshot is the only one on screen.

## Tweaking the balloons

Everything lives at the top of `constants/balloons.js`:

| What | Constant |
| --- | --- |
| Delay before launch | `LAUNCH_DELAY_MS` |
| How many balloons | `BALLOON_COUNT` |
| Balloon colors | `COLORS` |
| Size and speed | `MIN_SIZE` / `MAX_SIZE`, `SLOW_CYCLE_MS` / `FAST_CYCLE_MS` |

Each balloon gets a random depth: small ones drift up slowly, big ones come in
fast and close, and every one sways on its own sine wave. Where a balloon sits
is worked out from the clock alone, so there is no animation state to lose.

## Files

```
App.js                     screen: background + the balloons
components/BalloonField.js the balloons, and which ones are popped
components/Balloon.js      a single balloon: rise, sway, tilt, string, pop
constants/balloons.js      all the tunables
constants/background.js    which image sits behind everything
```

## Browser preview

`npm run web` renders the same screen in a browser. Useful for checking the
animation quickly; Expo Go is the real thing.

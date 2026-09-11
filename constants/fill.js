/**
 * Fill the parent, absolutely.
 *
 * Spelled out rather than taken from `StyleSheet.absoluteFillObject`, which
 * React Native 0.86 does not have — it only ships `absoluteFill`. Reading the
 * missing name gives `undefined`, `StyleSheet.create` passes that through
 * without a word, and the view silently loses its positioning. react-native-web
 * still exports both, so the same code is perfect in a browser and broken on a
 * phone, with nothing anywhere to say so.
 *
 * Nor can `...StyleSheet.absoluteFill` stand in: on web that is a compiled
 * style, and spreading it yields nonsense. The literal is the one spelling that
 * is right on both.
 */
export const FILL = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

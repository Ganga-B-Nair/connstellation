/**
 * Stars get a FIXED position the moment someone joins an event, so the sky
 * never rearranges itself when a new connection is made. A golden-angle
 * (phyllotaxis) spiral gives an even, natural-looking spread for any count.
 *
 * Positions live in a -500..500 box; the client scales them to the canvas.
 */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 rad
const RADIUS = 480;

export function starPositionForIndex(index, jitter = true) {
  const i = index + 1;
  const r = RADIUS * Math.sqrt(i / (i + 12));
  const theta = i * GOLDEN_ANGLE;
  const wobble = jitter ? (Math.random() - 0.5) * 18 : 0;
  return {
    x: Math.round((r * Math.cos(theta) + wobble) * 100) / 100,
    y: Math.round((r * Math.sin(theta) + wobble) * 100) / 100,
  };
}

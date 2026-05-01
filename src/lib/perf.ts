/**
 * Mark/measure helper.
 *
 * Phase 0: thin polyfill over Date.now(). Phase 2+ swaps in
 * `react-native-performance` for high-resolution timestamps.
 *
 * Keeps a ring buffer of the last 100 measurements for inspection from
 * dev tools / debug screens.
 */

type Measurement = {
  name: string;
  startMs: number;
  durationMs: number;
};

const RING_SIZE = 100;
const ring: Measurement[] = [];
const marks = new Map<string, number>();

function now(): number {
  return Date.now();
}

export function mark(name: string): void {
  marks.set(name, now());
}

export function measure(name: string, startMark: string): number | null {
  const start = marks.get(startMark);
  if (start == null) return null;
  const durationMs = now() - start;
  ring.push({ name, startMs: start, durationMs });
  if (ring.length > RING_SIZE) ring.shift();
  return durationMs;
}

export function getMeasurements(): readonly Measurement[] {
  return ring.slice();
}

export function clearMeasurements(): void {
  ring.length = 0;
  marks.clear();
}

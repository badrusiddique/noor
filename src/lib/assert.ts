/**
 * Tiny runtime assertion helper.
 *
 * Dev: throws on failure. Production: warns and returns — never crashes the
 * user's app for an internal invariant. Pair with proper error boundaries
 * for genuinely unrecoverable states.
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

export function assert(condition: unknown, message: string): asserts condition {
  if (condition) return;
  if (isDev) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.warn(`[noor] assertion failed: ${message}`);
}

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invariant violated: ${message}`);
  }
}

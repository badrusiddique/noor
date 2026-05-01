/**
 * Tiny leveled logger.
 *
 * - Dev: writes via console.* with the matching level.
 * - Production: no-op (silent).
 *
 * Includes a redaction helper that strips Quranic verse references from
 * arbitrary strings — defense in depth against accidentally logging
 * `surah:N`/`ayah:N` patterns where they could end up in crash reports
 * or shared screenshots.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

const VERSE_REF_RE = /\b(surah|ayah|verse)\s*[:=]\s*\d{1,3}(:\d{1,3})?/gi;

export function redact(input: string): string {
  return input.replace(VERSE_REF_RE, '[redacted]');
}

function emit(level: Level, args: unknown[]): void {
  if (!isDev) return;
  const fn = level === 'debug' ? console.log : console[level];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fn as (...a: unknown[]) => void)(...args);
}

export const logger = {
  debug: (...args: unknown[]) => emit('debug', args),
  info: (...args: unknown[]) => emit('info', args),
  warn: (...args: unknown[]) => emit('warn', args),
  error: (...args: unknown[]) => emit('error', args),
  redact,
};

export default logger;

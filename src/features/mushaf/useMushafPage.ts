/**
 * `useMushafPage(pageNo)` — wraps `getPage()` with a small LRU cache.
 *
 * The pager renders a sliding window of 5 pages so the same page can be
 * re-rendered several times. The cache keeps the last 16 results in
 * memory (3-4× the window) so quick back-and-forth swipes don't hit
 * SQLite. Eviction is move-to-front-on-hit (Map preserves insertion
 * order in ES2015+, so we delete-and-reinsert on access).
 */

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';

import { getPage, type PageDTO } from '../../data/queries/page';

const CACHE_SIZE = 16;
const cache = new Map<number, PageDTO>();
const inFlight = new Map<number, Promise<PageDTO>>();

function lruGet(pageNo: number): PageDTO | undefined {
  const v = cache.get(pageNo);
  if (v === undefined) return undefined;
  cache.delete(pageNo);
  cache.set(pageNo, v);
  return v;
}

function lruSet(pageNo: number, page: PageDTO): void {
  if (cache.has(pageNo)) cache.delete(pageNo);
  cache.set(pageNo, page);
  while (cache.size > CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export async function fetchPageCached(pageNo: number): Promise<PageDTO> {
  const cached = lruGet(pageNo);
  if (cached) return cached;
  const pending = inFlight.get(pageNo);
  if (pending) return pending;

  const promise = getPage(pageNo)
    .then((p) => {
      lruSet(pageNo, p);
      return p;
    })
    .finally(() => {
      inFlight.delete(pageNo);
    });
  inFlight.set(pageNo, promise);
  return promise;
}

/** Fire-and-forget warmup for adjacent pages. */
export function prefetchPage(pageNo: number): void {
  if (pageNo < 1 || pageNo > 604) return;
  if (lruGet(pageNo) || inFlight.has(pageNo)) return;
  fetchPageCached(pageNo).catch((e: unknown) => {
    logger.warn('[mushaf] prefetch failed for page', pageNo, e);
  });
}

export type MushafPageHook =
  | { data: PageDTO; isLoading: false; error: null }
  | { data: null; isLoading: true; error: null }
  | { data: null; isLoading: false; error: Error };

export function useMushafPage(pageNo: number): MushafPageHook {
  const [state, setState] = useState<MushafPageHook>(() => {
    const cached = lruGet(pageNo);
    if (cached) return { data: cached, isLoading: false, error: null };
    return { data: null, isLoading: true, error: null };
  });

  useEffect(() => {
    let cancelled = false;
    const cached = lruGet(pageNo);
    if (cached) {
      setState({ data: cached, isLoading: false, error: null });
      return;
    }
    setState({ data: null, isLoading: true, error: null });
    fetchPageCached(pageNo)
      .then((p) => {
        if (cancelled) return;
        setState({ data: p, isLoading: false, error: null });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const err = e instanceof Error ? e : new Error(String(e));
        setState({ data: null, isLoading: false, error: err });
      });
    return () => {
      cancelled = true;
    };
  }, [pageNo]);

  return state;
}

/** Test-only. */
export function __clearPageCacheForTests(): void {
  cache.clear();
  inFlight.clear();
}

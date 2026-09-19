import type { HealthProbe } from './ports/health-probe.ts';

export async function checkReadiness(probe: HealthProbe): Promise<boolean> {
  try {
    await probe.check();
    return true;
  } catch {
    return false;
  }
}

export interface ReadinessOptions {
  ttlMs?: number;
  now?: () => number;
}

// Readiness is unauthenticated, so an uncached probe lets any caller turn one
// cheap request into one database query. Results are reused for a short window
// and concurrent callers share a single in-flight probe.
export function createReadinessCheck(
  probe: HealthProbe,
  { ttlMs = 1000, now = Date.now }: ReadinessOptions = {},
): () => Promise<boolean> {
  let expiresAt = 0;
  let cached = false;
  let inFlight: Promise<boolean> | null = null;

  return function isReady(): Promise<boolean> {
    if (now() < expiresAt) return Promise.resolve(cached);
    inFlight ??= checkReadiness(probe).then((ready) => {
      cached = ready;
      expiresAt = now() + ttlMs;
      inFlight = null;
      return ready;
    });
    return inFlight;
  };
}

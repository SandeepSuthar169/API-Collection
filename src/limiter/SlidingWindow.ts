// middlewares/slidingWindowLimiter.ts
import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/utiles/error.utiles";

interface SlidingWindowOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface Entry {
  windowStart: number; // start time of the current fixed slot
  current: number;     // requests in the current slot
  previous: number;    // requests in the previous slot
}

export const SLrateLimiter = ({
  windowMs,
  max,
  message = "Too many requests, please try again later",
  keyGenerator = (req) => req.ip ?? "unknown",
}: SlidingWindowOptions) => {
  const store = new Map<string, Entry>();

  // Entries older than 2 windows no longer affect any calculation
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart >= 2 * windowMs) store.delete(key);
    }
  }, windowMs);
  cleanup.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;

    let entry = store.get(key);

    if (!entry) {
      entry = { windowStart, current: 0, previous: 0 };
      store.set(key, entry);
    } else if (entry.windowStart !== windowStart) {
      // Moved into a new slot. If it's the very next slot, the old count
      // becomes "previous". If we skipped slots, previous is 0.
      entry.previous =
        windowStart - entry.windowStart === windowMs ? entry.current : 0;
      entry.current = 0;
      entry.windowStart = windowStart;
    }

    // How far we are into the current slot (0 to 1)
    const elapsedRatio = (now - windowStart) / windowMs;

    // Weighted estimate of requests in the last `windowMs`
    const estimated = entry.previous * (1 - elapsedRatio) + entry.current;

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, Math.floor(max - estimated - 1)));

    if (estimated >= max) {
      // Approximate wait until the estimate drops below the limit
      const slotEndMs = windowStart + windowMs - now;
      let retryMs = slotEndMs;
      if (entry.previous > 0 && entry.current < max) {
        const neededRatio = 1 - (max - entry.current - 1) / entry.previous;
        retryMs = Math.min(slotEndMs, Math.max(0, neededRatio * windowMs - (now - windowStart)));
      }
      res.setHeader("Retry-After", Math.max(1, Math.ceil(retryMs / 1000)));
      return next(new AppError(message, 429));
    }

    entry.current++; // only count allowed requests
    next();
  };
};
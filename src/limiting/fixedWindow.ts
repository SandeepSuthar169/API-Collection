// middlewares/rateLimiter.ts
import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/utiles/error.utiles";

interface RateLimitOptions {
  windowMs: number; // window size in milliseconds
  max: number; // max requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface WindowEntry {
  count: number;
  resetTime: number; // timestamp when this window ends
}

export const rateLimiter = ({
  windowMs,
  max,
  message = "Too many requests, please try again later",
  keyGenerator = (req) => req.ip ?? "unknown",
}: RateLimitOptions) => {
  const store = new Map<string, WindowEntry>();

  // Remove expired entries so the Map doesn't grow forever
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetTime <= now) store.delete(key);
    }
  }, windowMs);
  cleanup.unref(); // don't keep the process alive just for this timer

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = store.get(key);

    // No entry yet, or the window has expired: start a new window
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetTime / 1000));

    if (entry.count > max) {
      res.setHeader("Retry-After", resetSeconds);
      return next(new AppError(message, 429));
    }

    next();
  };
};
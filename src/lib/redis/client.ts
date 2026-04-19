import { Redis } from "@upstash/redis";

/**
 * Upstash Redis client singleton.
 *
 * Used for the SSE event bus, rate limiting, and caching.
 * Returns null if environment variables are not configured,
 * allowing the app to run without Redis in development.
 */
export const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Helper to publish an event to a Redis channel.
 * No-ops if Redis is not configured.
 */
export async function publishEvent(
  channel: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!redis) {
    console.warn(
      "[PeptideIQ Redis] Redis not configured. Event not published:",
      channel
    );
    return;
  }
  await redis.publish(channel, JSON.stringify(data));
}

/**
 * Helper to get a cached value or compute it.
 * Falls back to computing directly if Redis is not configured.
 */
export async function getCached<T>(
  key: string,
  computeFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  if (!redis) {
    return computeFn();
  }

  const cached = await redis.get<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const value = await computeFn();
  await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  return value;
}

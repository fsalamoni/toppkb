/**
 * Rate limit in-memory (por processo).
 * Em produção, substituir por Redis ou Upstash.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(limit: number, windowSec: number = 60) {
  return (req: any, res: any, next: any): void => {
    const uid = req.user?.uid;
    if (!uid) {
      next();
      return;
    }
    const key = `${uid}:${req.path}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + windowSec * 1000 };
      buckets.set(key, bucket);
    }

    bucket.count++;
    if (bucket.count > limit) {
      res.status(429).json({
        error: {
          code: 'rate_limited',
          message: `Limite de ${limit} requisições por ${windowSec}s excedido`,
        },
      });
      return;
    }

    next();
  };
}

// Limpa buckets expirados a cada 5min
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k);
  }
}, 5 * 60 * 1000).unref();

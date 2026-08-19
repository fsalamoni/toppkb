// Helpers de async (timeout + safe wrappers)

const DEFAULT_TIMEOUT = 10000; // 10s

export function withTimeout<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT, label = 'operação'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} não respondeu em ${ms / 1000}s`)), ms),
    ),
  ]);
}

export async function safeGetDocs<T = any>(q: any, ms = DEFAULT_TIMEOUT, label = 'firestore'): Promise<T[]> {
  try {
    const snap: any = await withTimeout(q, ms, label);
    if (!snap?.docs) return [];
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  } catch (e: any) {
    console.warn(`[safeGetDocs ${label}]:`, e?.message || e);
    return [];
  }
}

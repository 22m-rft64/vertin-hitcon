const locks = new Map<string, Promise<void>>();

export const withAsyncLock = async <T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> => {
  const prev = locks.get(key) ?? Promise.resolve();
  let resolve: () => void;
  const next = new Promise<void>((r) => { resolve = r; });
  locks.set(key, next);
  await prev;
  try {
    return await fn();
  } finally {
    locks.delete(key);
    resolve!();
  }
};

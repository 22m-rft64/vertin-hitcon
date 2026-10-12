interface ThreadEntry {
  totalCount: number;
  recentTimestamps: number[];
}

const threadData = new Map<string, ThreadEntry>();

export const recordThreadMessage = (threadId: string): void => {
  const entry = threadData.get(threadId) ?? { totalCount: 0, recentTimestamps: [] };
  entry.totalCount++;
  entry.recentTimestamps.push(Date.now());
  threadData.set(threadId, entry);
};

export interface ThreadActivity {
  totalMessages: number;
  recentCount: number;
  lastActive: number | null;
}

export const getThreadActivity = (
  threadId: string,
  windowMinutes = 30,
): ThreadActivity => {
  const entry = threadData.get(threadId);
  if (!entry) {
    return { totalMessages: 0, recentCount: 0, lastActive: null };
  }
  const cutoff = Date.now() - windowMinutes * 60_000;
  return {
    totalMessages: entry.totalCount,
    recentCount: entry.recentTimestamps.filter((t) => t > cutoff).length,
    lastActive: entry.recentTimestamps.at(-1) ?? null,
  };
};

export const removeThread = (threadId: string): void => {
  threadData.delete(threadId);
};

export const pruneOldTimestamps = (windowMinutes = 30): void => {
  const cutoff = Date.now() - windowMinutes * 60_000;
  for (const [threadId, entry] of threadData) {
    entry.recentTimestamps = entry.recentTimestamps.filter((t) => t > cutoff);
    if (entry.totalCount === 0 && entry.recentTimestamps.length === 0) {
      threadData.delete(threadId);
    }
  }
};

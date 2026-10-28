export async function readListWithFallback<T>(read: () => Promise<T[]>): Promise<{ rows: T[]; failed: boolean }> {
  try {
    return { rows: await read(), failed: false };
  } catch {
    return { rows: [], failed: true };
  }
}

import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

export function useRemoteData<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState(initial);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setIsRefreshing(true);
    setError(null);
    try {
      const next = await load();
      if (current === generation.current) setData(next);
    } catch (failure) {
      if (current === generation.current) setError(failure instanceof Error ? failure.message : "Could not load this content.");
    } finally {
      if (current === generation.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [load]);
  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { generation.current += 1; };
  }, [refresh]));
  return { data, isLoading, isRefreshing, error, refresh };
}

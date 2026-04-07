import { useEffect, useCallback } from 'react';

export function useAutoRefresh(onRefresh: () => void, interval = 5000) {
  useEffect(() => {
    const id = setInterval(onRefresh, interval);
    onRefresh();
    return () => clearInterval(id);
  }, [onRefresh, interval]);
}

export function useManualRefresh(fetchFn: () => Promise<void>) {
  const refresh = useCallback(async () => {
    await fetchFn();
  }, [fetchFn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { refresh };
}

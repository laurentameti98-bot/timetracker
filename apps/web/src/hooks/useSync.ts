import { useState, useCallback } from "react";
import { syncToServer } from "../lib/sync";

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(() => {
    const s = localStorage.getItem("lastSync");
    return s ? parseInt(s, 10) : null;
  });

  const sync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const now = await syncToServer();
      return now;
    } catch (e) {
      console.warn("Sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const syncWithUpdate = useCallback(async () => {
    const now = await sync();
    if (typeof now === "number") setLastSync(now);
  }, [sync]);

  return { sync: syncWithUpdate, isSyncing, lastSync };
}

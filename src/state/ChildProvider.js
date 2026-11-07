// The parent's children + the one currently selected (remembered between app starts).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { parentApi } from "../api/endpoints";
import { qk } from "./queryClient";

const KEY = "erp.parent.childId";
const Ctx = createContext(null);
export const useChild = () => useContext(Ctx);

export function ChildProvider({ children }) {
  const q = useQuery({ queryKey: qk.children, queryFn: parentApi.children });
  const [childId, setId] = useState(null);

  useEffect(() => { AsyncStorage.getItem(KEY).then((v) => v && setId(Number(v))).catch(() => {}); }, []);
  const list = q.data || [];
  const child = list.find((c) => c.id === childId) || list[0] || null;

  const setChildId = useCallback((id) => {
    setId(id);
    AsyncStorage.setItem(KEY, String(id)).catch(() => {});
  }, []);

  const value = useMemo(() => ({
    children: q.data, child, childId: child?.id ?? null, setChildId,
    loading: q.isLoading, error: q.error, reload: q.refetch,
  }), [q.data, child, setChildId, q.isLoading, q.error, q.refetch]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

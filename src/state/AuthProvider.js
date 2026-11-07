// Who is logged in and which part of the app they see:
// next_step from the server = instructions -> payment -> parent_home.
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setApiHandlers } from "../api/client";
import { authApi } from "../api/endpoints";
import { tokenStorage } from "../api/tokenStorage";
import { unregisterPush } from "../services/push";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const PARENT_STEPS = ["instructions", "payment", "parent_home"];

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [nextStep, setNextStep] = useState(null);
  const [ready, setReady] = useState(false);

  const reset = useCallback(() => { setUser(null); setNextStep(null); qc.clear(); }, [qc]);

  const refreshMe = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
    setNextStep(me.next_step);
    return me;
  }, []);

  useEffect(() => {
    setApiHandlers({
      onSignedOut: reset,
      onPaymentRequired: (step) => setNextStep(PARENT_STEPS.includes(step) ? step : "payment"),
    });
    (async () => {
      const t = await tokenStorage.load();
      if (t?.access) {
        try { await refreshMe(); } catch (e) { if (!e.network) await tokenStorage.clear(); else setUser({ offline: true }); }
      }
      setReady(true);
    })();
  }, [refreshMe, reset]);

  const signIn = useCallback(async (mobile, password) => {
    const d = await authApi.login(mobile, password);
    const types = d.user?.user_type || [];
    if (!types.includes("PARENT")) {
      await authApi.logout();
      throw new Error(types.includes("TEACHER") || types.includes("STAFF")
        ? "This is a teacher login. Please use the Teacher app."
        : "This login is for the School ERP website, not the Parent app.");
    }
    setUser(d.user);
    setNextStep(d.next_step);
    return d;
  }, []);

  const signOut = useCallback(async () => {
    await unregisterPush();
    await authApi.logout();
    reset();
  }, [reset]);

  const value = useMemo(() => ({ user, ready, nextStep, setNextStep, setUser, signIn, signOut, refreshMe, signedIn: !!user }),
    [user, ready, nextStep, signIn, signOut, refreshMe]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

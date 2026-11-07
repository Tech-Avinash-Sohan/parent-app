// Login tokens: iOS Keychain / Android Keystore (expo-secure-store). Web (testing only) uses localStorage.
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "erp.parent.session";
const PUSH_KEY = "erp.parent.pushToken";
const web = Platform.OS === "web";

async function getItem(k) {
  if (web) { try { return globalThis.localStorage?.getItem(k) ?? null; } catch { return null; } }
  return SecureStore.getItemAsync(k);
}
async function setItem(k, v) {
  if (web) { try { globalThis.localStorage?.setItem(k, v); } catch { /* private mode */ } return; }
  await SecureStore.setItemAsync(k, v, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
}
async function delItem(k) {
  if (web) { try { globalThis.localStorage?.removeItem(k); } catch { /* ignore */ } return; }
  await SecureStore.deleteItemAsync(k);
}

let cache; // { access, refresh, expiresAt }

export const tokenStorage = {
  async load() {
    if (cache !== undefined) return cache;
    try { cache = JSON.parse((await getItem(KEY)) || "null"); } catch { cache = null; }
    return cache;
  },
  get: () => cache || null,
  async save({ access, refresh, expires_in }) {
    cache = { access, refresh, expiresAt: Date.now() + (Number(expires_in) || 3600) * 1000 };
    await setItem(KEY, JSON.stringify(cache));
    return cache;
  },
  async clear() { cache = null; await delItem(KEY); },
  getPushToken: () => getItem(PUSH_KEY),
  setPushToken: (t) => (t ? setItem(PUSH_KEY, t) : delItem(PUSH_KEY)),
};

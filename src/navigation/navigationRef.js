// Navigate from outside React components (push notification taps).
import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();
const queue = [];

export function onNavReady() {
  while (queue.length) queue.shift()();
}
export function whenNavReady(fn) {
  if (navigationRef.isReady()) setTimeout(fn, 0);
  else queue.push(fn);
}
export function navigate(name, params) {
  if (!navigationRef.isReady()) return whenNavReady(() => navigate(name, params));
  try { navigationRef.navigate(name, params); } catch { /* screen not available (e.g. not paid yet) */ }
}

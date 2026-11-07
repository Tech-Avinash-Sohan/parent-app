// Push notifications (Expo Notifications -> Expo push service -> FCM on Android / APNs on iOS).
// - asks permission, gets the Expo push token, sends it to the backend (/notifications/devices/)
// - shows notifications while the app is open (foreground)
// - opens the right screen when a notification is tapped (background and closed app)
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { notificationsApi } from "../api/endpoints";
import { tokenStorage } from "../api/tokenStorage";
import { ENV } from "../config/env";

const supported = Platform.OS !== "web";

// Foreground: show the banner + play sound, keep it in the notification list.
if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true,
    }),
  });
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "School updates",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3446D6",
    sound: "default",
  });
}

/** Current permission: "granted" | "denied" | "undetermined" | "unsupported" */
export async function permissionStatus() {
  if (!supported || !Device.isDevice) return "unsupported";
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Ask permission (once), get the Expo push token and register it for the logged-in parent.
 * Returns { ok, reason?, token? } – never throws, push must not break login.
 */
export async function registerForPush({ ask = true } = {}) {
  try {
    if (!supported) return { ok: false, reason: "Push notifications work in the Android / iOS app only." };
    if (!Device.isDevice) return { ok: false, reason: "Push notifications need a real phone (not an emulator)." };
    await ensureAndroidChannel();
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted" && ask) ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== "granted") return { ok: false, reason: "Notifications are turned off for this app in phone settings." };
    const projectId = ENV.EAS_PROJECT_ID || Constants.easConfig?.projectId;
    if (!projectId) return { ok: false, reason: "EAS project id missing – run `eas init` (see README)." };
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await notificationsApi.registerDevice(token, Platform.OS);
    await tokenStorage.setPushToken(token);
    return { ok: true, token };
  } catch (e) {
    return { ok: false, reason: e?.message || "Could not turn on notifications." };
  }
}

/** On logout: stop pushes to this phone for this parent. */
export async function unregisterPush() {
  try {
    const token = await tokenStorage.getPushToken();
    if (token) await notificationsApi.unregisterDevice(token);
  } catch { /* offline: the server drops dead tokens itself */ }
  await tokenStorage.setPushToken(null).catch(() => {});
  if (supported) Notifications.setBadgeCountAsync(0).catch(() => {});
}

export const setBadge = (n) => (supported ? Notifications.setBadgeCountAsync(n || 0).catch(() => {}) : null);

/** Where a notification opens: route name + params (see navigation/linking.js). */
export function routeForData(data = {}) {
  switch (data.event) {
    case "STUDENT_ABSENT":
    case "LEAVE_DECIDED":
      return { name: "Attendance" };
    case "HOMEWORK_ASSIGNED":
      return { name: "Homework" };
    case "RESULT_PUBLISHED":
      return { name: "Exams" };
    case "FEE_RECEIPT":
    case "FEE_REMINDER":
      return { name: "Tabs", params: { screen: "FeesTab" } };
    case "CERTIFICATE_READY":
      return { name: "Certificates" };
    case "MEETING_BOOKED":
      return { name: "Meetings" };
    case "COMPLAINT_UPDATE":
      return { name: "Complaints" };
    case "NOTICE_PUBLISHED":
      return data.notice ? { name: "NoticeDetail", params: { id: data.notice } } : { name: "Notices" };
    case "CHAT_MESSAGE":
      return data.thread ? { name: "ChatThread", params: { id: data.thread, title: data.title } } : { name: "Tabs", params: { screen: "ChatTab" } };
    default:
      return { name: "Notifications" };
  }
}

export const supportsPush = supported;
export { Notifications };

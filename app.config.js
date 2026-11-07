// Expo config. Values come from .env (local) or EAS environment variables (cloud builds).
// APP_ENV: development | preview | production
const APP_ENV = process.env.APP_ENV || "development";
const IS_PROD = APP_ENV === "production";

module.exports = {
  expo: {
    name: IS_PROD ? "School ERP Parent" : `School ERP Parent (${APP_ENV})`,
    slug: "school-erp-parent",
    scheme: "schoolerp-parent",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: { image: "./assets/splash-icon.png", resizeMode: "contain", backgroundColor: "#3446D6" },
    ios: {
      supportsTablet: false,
      bundleIdentifier: process.env.IOS_BUNDLE_ID || "com.schoolerp.parent",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "Take a photo of homework or a doctor's note to send to the school.",
        NSPhotoLibraryUsageDescription: "Choose a photo of homework or a doctor's note to send to the school.",
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: process.env.ANDROID_PACKAGE || "com.schoolerp.parent",
      versionCode: 1,
      adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: "#3446D6" },
      edgeToEdgeEnabled: true,
      permissions: ["android.permission.CAMERA", "android.permission.POST_NOTIFICATIONS"],
      // Firebase file for Android push (download from Firebase console, see README)
      ...(process.env.GOOGLE_SERVICES_JSON ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON } : {}),
    },
    web: { favicon: "./assets/favicon.png", output: "single", name: "School ERP Parent", themeColor: "#3446D6" },
    plugins: [
      "expo-secure-store",
      "expo-font",
      ["expo-notifications", { icon: "./assets/notification-icon.png", color: "#3446D6", defaultChannel: "default" }],
      ["expo-image-picker", { cameraPermission: "Take a photo of homework or a doctor's note to send to the school." }],
    ],
    extra: {
      appEnv: APP_ENV,
      eas: { projectId: process.env.EAS_PROJECT_ID || undefined },
    },
  },
};

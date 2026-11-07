// Build-time settings (from .env / EAS env). See .env.example.
import Constants from "expo-constants";

const trim = (u) => (u || "").replace(/\/+$/, "");

export const ENV = {
  APP_ENV: Constants.expoConfig?.extra?.appEnv || "development",
  API_URL: trim(process.env.EXPO_PUBLIC_API_URL) || "https://backend-drf-ygow.onrender.com/api/v1",
  API_TIMEOUT_MS: Number(process.env.EXPO_PUBLIC_API_TIMEOUT || 60) * 1000,
  EAS_PROJECT_ID: Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId || null,
  APP_VERSION: Constants.expoConfig?.version || "1.0.0",
  OTP_LENGTH: 4,
};

export const IS_DEV = ENV.APP_ENV !== "production";

// School ERP – Parent app (Android, iOS). Providers: safe area, server data cache, login, toasts, navigation.
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "./src/components/ErrorBoundary";
import OfflineBanner from "./src/components/OfflineBanner";
import { ToastProvider } from "./src/components/Toast";
import { linking } from "./src/navigation/linking";
import { navigationRef, onNavReady } from "./src/navigation/navigationRef";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/state/AuthProvider";
import { queryClient } from "./src/state/queryClient";
import { colors } from "./src/theme";

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.bg, card: "#fff", text: colors.text, border: colors.border } };

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <NavigationContainer ref={navigationRef} theme={theme} linking={linking} onReady={onNavReady}>
                <RootNavigator />
              </NavigationContainer>
              <OfflineBanner />
              <StatusBar style="dark" />
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

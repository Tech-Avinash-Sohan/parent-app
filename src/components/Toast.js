// Short success / error messages that slide in at the bottom (useToast().show("Saved")).
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
import { Icon } from "./ui";

const Ctx = createContext({ show: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);
  const insets = useSafeAreaInsets();
  const show = useCallback((text, kind = "success") => {
    clearTimeout(timer.current);
    setMsg({ text, kind });
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    timer.current = setTimeout(() => Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setMsg(null)), 2600);
  }, [anim]);
  const bg = msg?.kind === "error" ? colors.danger : colors.dark;
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {msg && (
        <Animated.View pointerEvents="none" style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 80, opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <View accessibilityLiveRegion="polite" style={{ backgroundColor: bg, borderRadius: 14, padding: 14, flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Icon name={msg.kind === "error" ? "alert-circle" : "checkmark-circle"} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600", flex: 1 }}>{msg.text}</Text>
          </View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

// Last safety net: a crash in one screen shows "Something went wrong" + restart instead of a white screen.
import { Component } from "react";
import { Text, View } from "react-native";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12, backgroundColor: "#F5F6FA" }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#0F172A" }}>Something went wrong</Text>
        <Text style={{ color: "#475569", textAlign: "center" }}>Please try again. If it keeps happening, update the app.</Text>
        <Text onPress={() => this.setState({ error: null })} accessibilityRole="button"
          style={{ color: "#fff", backgroundColor: "#3446D6", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, fontWeight: "700", overflow: "hidden" }}>
          Try again
        </Text>
      </View>
    );
  }
}

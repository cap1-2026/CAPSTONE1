import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Suppress known React Native Web deprecation warnings that come from
// the library itself (TouchableOpacity internals) or are being
// progressively migrated across files.
if (typeof __DEV__ !== "undefined" && __DEV__) {
  const _warn = console.warn;
  console.warn = (...args: any[]) => {
    const msg = String(args[0] ?? "");
    if (
      msg.includes('"shadow*" style props are deprecated') ||
      msg.includes("props.pointerEvents is deprecated")
    ) return;
    _warn(...args);
  };
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

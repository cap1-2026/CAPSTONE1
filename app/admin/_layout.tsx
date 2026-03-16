// app/admin/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserStorage } from "../../utils/userStorage";

export default function AdminLayout() {
  const router   = useRouter();
  const segments = useSegments();
  const insets   = useSafeAreaInsets();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    UserStorage.getUser().then((user) => {
      if (!user || user.role !== "admin") {
        router.replace("/" as any);
        return;
      }
      setAuthChecked(true);
    });
  }, []);

  async function handleLogout() {
    await UserStorage.clearUser();
    router.replace("/" as any);
  }

  if (!authChecked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  const lastSegment = segments[segments.length - 1];
  const isDashboard = lastSegment === "dashboard";

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topLeft}>
          {!isDashboard && (
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={18} color="#374151" />
            </TouchableOpacity>
          )}
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="shield-checkmark" size={15} color="#fff" />
            </View>
            <Text style={styles.logoText}>Admin Panel</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: "#F8FAFC" },
  loading:    { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
  topBar:     { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 10, justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6 },
  topLeft:    { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn:    { width: 32, height: 32, borderRadius: 8, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  logoRow:    { flexDirection: "row", alignItems: "center", gap: 7 },
  logoIcon:   { width: 28, height: 28, borderRadius: 7, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center" },
  logoText:   { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  logoutBtn:  { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FEF2F2", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: "#FECACA" },
  logoutText: { fontSize: 13, fontWeight: "700", color: "#DC2626" },
});

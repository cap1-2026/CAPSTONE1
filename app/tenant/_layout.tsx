// app/tenant/_layout.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserStorage } from "../../utils/userStorage";
import { shadow } from "../../utils/shadow";

export default function TenantLayout() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const lastSegment = segments[segments.length - 1];
  const isHome = lastSegment === "home";
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    UserStorage.getUser("tenant").then((user) => {
      if (!user || user.role !== "tenant") {
        router.replace("/" as any);
        return;
      }
      setAuthChecked(true);
    });
  }, []);

  async function handleLogout() {
    await UserStorage.clearUser("tenant");
    router.replace("/" as any);
  }

  if (!authChecked) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          {!isHome ? (
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/tenant/home" as any)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color="#374151" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.logoRow} onPress={() => router.push("/tenant/home" as any)}>
            <Image source={require("../../assets/images/apartmentlogo.png")} style={styles.logoImg} />
            <Text style={styles.logoText}>PadFinder</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push("/tenant/dashboard" as any)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="view-dashboard-outline" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/tenant/approvals" as any)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="clock-check-outline" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/tenant/notifications" as any)} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10, justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', ...shadow("#000", 0.04, 6, 2) },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:     { width: 34, height: 34, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logoImg:     { width: 32, height: 32, borderRadius: 8 },
  logoText:    { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn:     { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  logoutBtn:   { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
});

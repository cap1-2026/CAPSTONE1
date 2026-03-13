import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Slot, useRouter, useSegments } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TenantLayout() {
  const router = useRouter();
  const segments = useSegments();
  const lastSegment = segments[segments.length - 1];
  const isHome = lastSegment === "home";

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!isHome ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color="#374151" />
            </TouchableOpacity>
          ) : null}
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="home" size={16} color="#fff" />
            </View>
            <Text style={styles.logoText}>PadFinder</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push("/tenant/dashboard")} style={styles.iconBtn}>
            <MaterialCommunityIcons name="view-dashboard-outline" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/tenant/approvals")} style={styles.iconBtn}>
            <MaterialCommunityIcons name="clock-check-outline" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/tenant/notifications")} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 58, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logoIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
});
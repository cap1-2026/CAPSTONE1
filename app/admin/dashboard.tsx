// app/admin/dashboard.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API_ENDPOINTS from "../../config/api";

interface Stats {
  total_properties: number;
  pending_properties: number;
  approved_properties: number;
  total_users: number;
  total_owners: number;
  total_tenants: number;
  total_bookings: number;
  pending_bookings: number;
  total_revenue: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsError, setStatsError] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsError(false);
    try {
      const res  = await fetch(API_ENDPOINTS.GET_ADMIN_STATS);
      const data = await res.json();
      if (data.status === "success") setStats(data.data);
      else setStatsError(true);
    } catch {
      setStatsError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  function onRefresh() { setRefreshing(true); fetchStats(); }

  async function handleLogout() {
    await AsyncStorage.removeItem("@padfinder_user");
    router.replace("/admin/login" as any);
  }

  const statCards = stats ? [
    { icon: "home-city-outline",      label: "Total Properties", value: stats.total_properties,   color: "#2563EB", bg: "#EFF6FF" },
    { icon: "clock-check-outline",    label: "Pending Approval", value: stats.pending_properties,  color: "#D97706", bg: "#FFFBEB" },
    { icon: "check-decagram-outline", label: "Approved",         value: stats.approved_properties, color: "#059669", bg: "#F0FDF4" },
    { icon: "account-group-outline",  label: "Total Users",      value: stats.total_users,         color: "#7C3AED", bg: "#F5F3FF" },
    { icon: "account-tie-outline",    label: "Owners",           value: stats.total_owners,        color: "#0891B2", bg: "#ECFEFF" },
    { icon: "account-outline",        label: "Tenants",          value: stats.total_tenants,       color: "#EA580C", bg: "#FFF7ED" },
    { icon: "calendar-check-outline", label: "Total Bookings",   value: stats.total_bookings,      color: "#8B5CF6", bg: "#F5F3FF" },
    { icon: "clock-alert-outline",    label: "Pending Bookings", value: stats.pending_bookings,    color: "#EA580C", bg: "#FFF7ED" },
    { icon: "cash-multiple",          label: "Total Revenue",    value: `₱${(stats.total_revenue || 0).toLocaleString()}`, color: "#16A34A", bg: "#F0FDF4" },
  ] : [];

  const quickActions = [
    { icon: "shield-check-outline",  label: "Property Approvals", desc: "Review pending listings", path: "/admin/approvals",  color: "#D97706", bg: "#FFFBEB" },
    { icon: "home-city-outline",     label: "All Properties",     desc: "Manage all listings",     path: "/admin/properties", color: "#2563EB", bg: "#EFF6FF" },
    { icon: "account-group-outline", label: "Users",              desc: "View all users",          path: "/admin/users",      color: "#7C3AED", bg: "#F5F3FF" },
    { icon: "cash-multiple",         label: "Payments",           desc: "Financial overview",      path: "/admin/payments",   color: "#16A34A", bg: "#F0FDF4" },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1D4ED8"]} />}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>PadFinder Control Panel</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color="#1D4ED8" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <>
          {statsError && (
            <TouchableOpacity style={styles.errorCard} onPress={onRefresh}>
              <Ionicons name="cloud-offline-outline" size={22} color="#DC2626" />
              <Text style={styles.errorText}>Could not load stats. Tap to retry.</Text>
            </TouchableOpacity>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform Overview</Text>
            <View style={styles.statsGrid}>
              {statCards.map((card, i) => (
                <View key={i} style={[styles.statCard, { backgroundColor: card.bg }]}>
                  <View style={[styles.statIcon, { backgroundColor: card.color + "20" }]}>
                    <MaterialCommunityIcons name={card.icon as any} size={22} color={card.color} />
                  </View>
                  <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {stats && stats.pending_properties > 0 && (
            <TouchableOpacity style={styles.alertCard} onPress={() => router.push("/admin/approvals" as any)}>
              <View style={styles.alertLeft}>
                <Ionicons name="alert-circle" size={24} color="#D97706" />
                <View>
                  <Text style={styles.alertTitle}>{stats.pending_properties} Properties Awaiting Approval</Text>
                  <Text style={styles.alertSub}>Tap to review and approve listings</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D97706" />
            </TouchableOpacity>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((item, i) => (
                <TouchableOpacity key={i} style={[styles.actionCard, { backgroundColor: item.bg }]} onPress={() => router.push(item.path as any)}>
                  <View style={[styles.actionIcon, { backgroundColor: item.color + "20" }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={26} color={item.color} />
                  </View>
                  <Text style={[styles.actionLabel, { color: item.color }]}>{item.label}</Text>
                  <Text style={styles.actionDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
              <View style={styles.logoutCardIcon}>
                <Ionicons name="log-out-outline" size={22} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logoutCardTitle}>Logout</Text>
                <Text style={styles.logoutCardSub}>Sign out of admin panel</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#F8FAFC" },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingTop: 24, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 8 },
  headerTitle:     { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  headerSub:       { fontSize: 13, color: "#64748B", marginTop: 2 },
  refreshBtn:      { width: 40, height: 40, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  logoutBtn:       { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" },
  errorCard:       { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FEF2F2", marginHorizontal: 16, marginTop: 14, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#FECACA" },
  errorText:       { fontSize: 13, color: "#DC2626", fontWeight: "500", flex: 1 },
  loadingBox:      { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  loadingText:     { marginTop: 12, color: "#64748B", fontSize: 14 },
  section:         { padding: 16, paddingBottom: 4 },
  sectionTitle:    { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
  statsGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard:        { width: "47%", borderRadius: 14, padding: 14, gap: 6 },
  statIcon:        { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue:       { fontSize: 22, fontWeight: "800" },
  statLabel:       { fontSize: 12, color: "#64748B", fontWeight: "500" },
  alertCard:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFBEB", marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#FDE68A" },
  alertLeft:       { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  alertTitle:      { fontSize: 14, fontWeight: "700", color: "#92400E" },
  alertSub:        { fontSize: 12, color: "#B45309", marginTop: 2 },
  actionsGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard:      { width: "47%", borderRadius: 14, padding: 14, gap: 6 },
  actionIcon:      { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionLabel:     { fontSize: 14, fontWeight: "700", marginTop: 4 },
  actionDesc:      { fontSize: 12, color: "#64748B" },
  logoutCard:      { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#FEF2F2", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#FECACA", marginBottom: 16 },
  logoutCardIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
  logoutCardTitle: { fontSize: 15, fontWeight: "700", color: "#DC2626" },
  logoutCardSub:   { fontSize: 12, color: "#EF4444", marginTop: 2 },
});
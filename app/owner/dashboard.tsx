import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

interface DashboardStats {
  total_properties: number;
  approved_properties: number;
  pending_properties: number;
  total_tenants: number;
  total_bookings: number;
  pending_bookings: number;
  total_revenue: number;
}

interface RecentBooking {
  id: number;
  tenant_name: string;
  property_name: string;
  status: string;
  created_at: string;
  property_price: number;
}

export default function OwnerDashboard() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("Owner");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (userId: number) => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.GET_PROPERTIES}?owner_stats=1&owner_id=${userId}`),
        fetch(`${API_ENDPOINTS.GET_BOOKINGS}?owner_id=${userId}&limit=5`),
      ]);

      const statsData = await statsRes.json();
      if (statsData.status === "success") setStats(statsData.data);

      const bookingsData = await bookingsRes.json();
      if (bookingsData.status === "success") setRecentBookings(bookingsData.data?.slice(0, 5) ?? []);
    } catch {
      // silently degrade
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    UserStorage.getUser().then((user) => {
      if (user) {
        setOwnerName(user.fullname || "Owner");
        fetchData(user.user_id);
      } else {
        setLoading(false);
      }
    });
  }, [fetchData]);

  function onRefresh() {
    setRefreshing(true);
    UserStorage.getUser().then((user) => { if (user) fetchData(user.user_id); });
  }

  const getStatusColor = (status: string) => {
    if (status === "approved") return "#059669";
    if (status === "pending") return "#D97706";
    return "#DC2626";
  };

  const statCards = stats ? [
    { icon: "home-city-outline", label: "Total Properties", value: stats.total_properties, color: "#2563EB", bg: "#EFF6FF" },
    { icon: "check-decagram-outline", label: "Approved", value: stats.approved_properties, color: "#059669", bg: "#F0FDF4" },
    { icon: "clock-outline", label: "Pending Review", value: stats.pending_properties, color: "#D97706", bg: "#FFFBEB" },
    { icon: "account-group-outline", label: "Tenants", value: stats.total_tenants, color: "#7C3AED", bg: "#F5F3FF" },
    { icon: "calendar-check-outline", label: "Bookings", value: stats.total_bookings, color: "#0891B2", bg: "#ECFEFF" },
    { icon: "cash-multiple", label: "Total Revenue", value: `₱${(stats.total_revenue || 0).toLocaleString()}`, color: "#16A34A", bg: "#F0FDF4" },
  ] : [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1D4ED8"]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreet}>Welcome back,</Text>
          <Text style={styles.headerName}>{ownerName} 👋</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <>
          {/* Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Overview</Text>
            <View style={styles.statsGrid}>
              {statCards.map((card, i) => (
                <View key={i} style={[styles.statCard, { backgroundColor: card.bg }]}>
                  <View style={[styles.statIcon, { backgroundColor: card.color + "20" }]}>
                    <MaterialCommunityIcons name={card.icon as any} size={20} color={card.color} />
                  </View>
                  <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pending bookings alert */}
          {stats && stats.pending_bookings > 0 && (
            <TouchableOpacity style={styles.alertCard} onPress={() => router.push("/owner/bookings" as any)}>
              <Ionicons name="alert-circle" size={22} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>{stats.pending_bookings} Booking{stats.pending_bookings > 1 ? "s" : ""} Awaiting Approval</Text>
                <Text style={styles.alertSub}>Tap to review booking requests</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D97706" />
            </TouchableOpacity>
          )}

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {[
                { icon: "home-city-outline", label: "Properties", path: "/owner/properties", color: "#2563EB", bg: "#EFF6FF" },
                { icon: "account-group-outline", label: "Tenants", path: "/owner/tenants", color: "#7C3AED", bg: "#F5F3FF" },
                { icon: "calendar-check-outline", label: "Bookings", path: "/owner/bookings", color: "#0891B2", bg: "#ECFEFF" },
                { icon: "cash-multiple", label: "Financials", path: "/owner/financials", color: "#16A34A", bg: "#F0FDF4" },
              ].map((item, i) => (
                <TouchableOpacity key={i} style={[styles.quickCard, { backgroundColor: item.bg }]} onPress={() => router.push(item.path as any)}>
                  <MaterialCommunityIcons name={item.icon as any} size={26} color={item.color} />
                  <Text style={[styles.quickLabel, { color: item.color }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Bookings */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              <TouchableOpacity onPress={() => router.push("/owner/bookings" as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {recentBookings.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>No bookings yet</Text>
              </View>
            ) : (
              recentBookings.map((booking) => (
                <View key={booking.id} style={styles.bookingRow}>
                  <View style={[styles.bookingDot, { backgroundColor: getStatusColor(booking.status) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingTenant}>{booking.tenant_name}</Text>
                    <Text style={styles.bookingProperty}>{booking.property_name}</Text>
                  </View>
                  <View>
                    <View style={[styles.bookingBadge, { backgroundColor: getStatusColor(booking.status) + "20" }]}>
                      <Text style={[styles.bookingBadgeText, { color: getStatusColor(booking.status) }]}>
                        {booking.status}
                      </Text>
                    </View>
                    <Text style={styles.bookingAmount}>₱{Number(booking.property_price).toLocaleString()}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerGreet: { fontSize: 14, color: "#64748B" },
  headerName: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginTop: 2 },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
  section: { padding: 16, paddingBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 13, color: "#2563EB", fontWeight: "600" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", borderRadius: 14, padding: 14, gap: 6 },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 12, color: "#64748B" },
  alertCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFBEB", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#FDE68A" },
  alertTitle: { fontSize: 14, fontWeight: "700", color: "#92400E" },
  alertSub: { fontSize: 12, color: "#B45309", marginTop: 2 },
  quickGrid: { flexDirection: "row", gap: 10 },
  quickCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center", gap: 6 },
  quickLabel: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  emptyCard: { alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 30, gap: 8 },
  emptyText: { fontSize: 14, color: "#94A3B8" },
  bookingRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, gap: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  bookingDot: { width: 10, height: 10, borderRadius: 5 },
  bookingTenant: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  bookingProperty: { fontSize: 12, color: "#64748B", marginTop: 2 },
  bookingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-end" },
  bookingBadgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  bookingAmount: { fontSize: 13, fontWeight: "700", color: "#1E293B", marginTop: 3, textAlign: "right" },
});
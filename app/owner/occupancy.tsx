import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

interface Booking {
  id: number;
  tenant_name: string;
  tenant_email: string;
  property_name: string;
  property_address: string;
  property_price: number;
  move_in: string;
  lease_duration: string;
  status: string;
  created_at: string;
}

export default function Occupancy() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async (ownerId: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_BOOKINGS}?owner_id=${ownerId}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") setBookings(data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    UserStorage.getUser().then((user) => {
      if (user) fetchBookings(user.user_id);
      else setLoading(false);
    });
  }, [fetchBookings]);

  function onRefresh() {
    setRefreshing(true);
    UserStorage.getUser().then((user) => { if (user) fetchBookings(user.user_id); });
  }

  const approved = bookings.filter((b) => b.status === "approved");
  const pending = bookings.filter((b) => b.status === "pending");
  const total = bookings.length;
  const occupancyRate = total > 0 ? Math.round((approved.length / total) * 100) : 0;

  const getStatusColor = (status: string) => {
    if (status === "approved") return "#059669";
    if (status === "pending") return "#D97706";
    return "#DC2626";
  };

  const getStatusBg = (status: string) => {
    if (status === "approved") return "#D1FAE5";
    if (status === "pending") return "#FEF3C7";
    return "#FEE2E2";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Occupancy Status</Text>
        <Text style={styles.subtitle}>{total} total booking{total !== 1 ? "s" : ""}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading occupancy data...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListHeaderComponent={
            <>
              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: "#F0FDF4" }]}>
                  <Ionicons name="checkmark-circle" size={22} color="#059669" />
                  <Text style={[styles.statValue, { color: "#059669" }]}>{approved.length}</Text>
                  <Text style={styles.statLabel}>Occupied</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: "#FFFBEB" }]}>
                  <Ionicons name="time" size={22} color="#D97706" />
                  <Text style={[styles.statValue, { color: "#D97706" }]}>{pending.length}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: "#EFF6FF" }]}>
                  <MaterialCommunityIcons name="percent" size={22} color="#2563EB" />
                  <Text style={[styles.statValue, { color: "#2563EB" }]}>{occupancyRate}%</Text>
                  <Text style={styles.statLabel}>Rate</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Occupancy Rate</Text>
                  <Text style={styles.progressPct}>{occupancyRate}%</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${occupancyRate}%` as any }]} />
                </View>
              </View>

              {bookings.length > 0 && (
                <Text style={styles.listTitle}>Booking Details</Text>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="home-city-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySub}>Occupancy data will appear once tenants book your properties.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={[styles.rowDot, { backgroundColor: getStatusColor(item.status) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tenantName}>{item.tenant_name}</Text>
                <Text style={styles.propertyName}>{item.property_name}</Text>
                <Text style={styles.metaText}>Move-in: {item.move_in} · {item.lease_duration}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#fff", padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  center: { alignItems: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 8 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#64748B" },
  progressSection: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  progressPct: { fontSize: 14, fontWeight: "800", color: "#2563EB" },
  progressBg: { height: 12, backgroundColor: "#E2E8F0", borderRadius: 6, overflow: "hidden" },
  progressFill: { height: 12, backgroundColor: "#2563EB", borderRadius: 6 },
  listTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", paddingHorizontal: 16, marginBottom: 8, marginTop: 4 },
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#94A3B8", marginTop: 10 },
  emptySub: { fontSize: 13, color: "#CBD5E1", textAlign: "center", lineHeight: 20 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 12, gap: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  rowDot: { width: 10, height: 10, borderRadius: 5 },
  tenantName: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  propertyName: { fontSize: 12, color: "#64748B", marginTop: 2 },
  metaText: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },
});
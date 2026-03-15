import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

interface Booking {
  id: number;
  property_name: string;
  property_address: string;
  property_price: number;
  move_in: string;
  lease_duration: string;
  status: "pending" | "approved" | "rejected";
  property_deposit: number;
  created_at: string;
}

export default function TenantPropertiesPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");

  const fetchBookings = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_BOOKINGS}?tenant_id=${userId}&_t=${Date.now()}`);
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

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

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

  const getStatusIcon = (status: string): any => {
    if (status === "approved") return "checkmark-circle";
    if (status === "pending") return "time";
    return "close-circle";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Properties</Text>
          <Text style={styles.headerSub}>{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(["all", "approved", "pending", "rejected"] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.tabActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading your properties...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="home-search-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
              </Text>
              {filter === "all" && (
                <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/tenant/browse-properties" as any)}>
                  <Text style={styles.browseBtnText}>Browse Properties</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Status Header */}
              <View style={[styles.statusBar, { backgroundColor: getStatusBg(item.status) }]}>
                <Ionicons name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status.toUpperCase()}
                </Text>
                <Text style={styles.submittedDate}>
                  Booked {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.cardBody}>
                {/* Property Info */}
                <Text style={styles.propertyName}>{item.property_name}</Text>

                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={14} color="#64748B" />
                  <Text style={styles.infoText}>{item.property_address}</Text>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Monthly Rent</Text>
                    <Text style={styles.detailValue}>₱{Number(item.property_price).toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Move-in Date</Text>
                    <Text style={styles.detailValue}>{item.move_in}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{item.lease_duration}</Text>
                  </View>
                </View>

                {/* Action for approved */}
                {item.status === "approved" && (
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => router.push({
                      pathname: "/tenant/payment",
                      params: {
                        booking_id: String(item.id),
                        amount: String(Number(item.property_deposit) || Number(item.property_price)),
                        property_name: item.property_name,
                        property_address: item.property_address,
                        monthly_rent: String(item.property_price),
                      },
                    } as any)}
                  >
                    <Ionicons name="card-outline" size={18} color="#fff" />
                    <Text style={styles.payBtnText}>Proceed to Payment</Text>
                  </TouchableOpacity>
                )}

                {item.status === "pending" && (
                  <View style={styles.pendingInfo}>
                    <Ionicons name="information-circle-outline" size={14} color="#D97706" />
                    <Text style={styles.pendingInfoText}>Awaiting owner approval (24–48 hours)</Text>
                  </View>
                )}

                {item.status === "rejected" && (
                  <TouchableOpacity
                    style={styles.browseAgainBtn}
                    onPress={() => router.push("/tenant/browse-properties" as any)}
                  >
                    <Ionicons name="search-outline" size={16} color="#2563EB" />
                    <Text style={styles.browseAgainText}>Browse Other Properties</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  backBtn: { marginRight: 10, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 12, color: "#64748B", marginTop: 1 },
  refreshBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  tabsRow: { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F1F5F9" },
  tabActive: { backgroundColor: "#1D4ED8" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#fff" },
  center: { alignItems: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
  listContent: { padding: 14, paddingBottom: 32 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#94A3B8" },
  browseBtn: { backgroundColor: "#1D4ED8", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  browseBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 14, marginBottom: 14, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statusBar: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, paddingHorizontal: 14 },
  statusText: { fontSize: 12, fontWeight: "700", flex: 1 },
  submittedDate: { fontSize: 11, color: "#94A3B8" },
  cardBody: { padding: 14 },
  propertyName: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  infoText: { fontSize: 13, color: "#64748B", flex: 1 },
  detailsRow: { flexDirection: "row", gap: 8, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 10, marginBottom: 12 },
  detailItem: { flex: 1, alignItems: "center" },
  detailLabel: { fontSize: 11, color: "#94A3B8", marginBottom: 3 },
  detailValue: { fontSize: 13, fontWeight: "700", color: "#1E293B", textAlign: "center" },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#059669", paddingVertical: 12, borderRadius: 10 },
  payBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  pendingInfo: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF3C7", padding: 10, borderRadius: 8 },
  pendingInfoText: { fontSize: 12, color: "#D97706", flex: 1 },
  browseAgainBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EFF6FF", paddingVertical: 10, borderRadius: 10 },
  browseAgainText: { color: "#2563EB", fontSize: 13, fontWeight: "600" },
});
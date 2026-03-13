import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

type TabType = "all" | "properties" | "payments" | "contracts";

interface Booking {
  id: number;
  property_name: string;
  property_address: string;
  property_price: number;
  move_in: string;
  lease_duration: string;
  status: string;
  created_at: string;
}

interface Payment {
  id: number;
  booking_id: number;
  property_name: string;
  amount: number;
  method: string;
  transaction_id: string;
  status: string;
  created_at: string;
}

export default function TenantDashboard() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<TabType>("all");
  const [tenantName, setTenantName] = useState("Tenant");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (userId: number) => {
    try {
      const [bookingsRes, paymentsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.GET_BOOKINGS}?tenant_id=${userId}`),
        fetch(`${API_ENDPOINTS.GET_PAYMENTS}?tenant_id=${userId}`),
      ]);

      const bookingsData = await bookingsRes.json();
      if (bookingsData.status === "success") setBookings(bookingsData.data ?? []);

      const paymentsData = await paymentsRes.json();
      if (paymentsData.status === "success") setPayments(paymentsData.data ?? []);
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
        setTenantName(user.fullname || "Tenant");
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

  const approvedBookings = bookings.filter((b) => b.status === "approved");
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  const getStatusColor = (status: string) => {
    if (status === "approved" || status === "paid") return "#059669";
    if (status === "pending") return "#D97706";
    return "#DC2626";
  };

  const getStatusBg = (status: string) => {
    if (status === "approved" || status === "paid") return "#D1FAE5";
    if (status === "pending") return "#FEF3C7";
    return "#FEE2E2";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Dashboard</Text>
          <Text style={styles.headerSub}>Welcome, {tenantName}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer} contentContainerStyle={styles.tabContentContainer}>
        {(["all", "properties", "payments", "contracts"] as TabType[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, selectedTab === t && styles.tabActive]} onPress={() => setSelectedTab(t)}>
            <Text style={[styles.tabText, selectedTab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Summary Cards */}
          {(selectedTab === "all") && (
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: "#EFF6FF" }]}>
                <MaterialCommunityIcons name="home-city" size={22} color="#2563EB" />
                <Text style={[styles.summaryValue, { color: "#2563EB" }]}>{approvedBookings.length}</Text>
                <Text style={styles.summaryLabel}>Active Rentals</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: "#FFFBEB" }]}>
                <Ionicons name="time-outline" size={22} color="#D97706" />
                <Text style={[styles.summaryValue, { color: "#D97706" }]}>{pendingBookings.length}</Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: "#F0FDF4" }]}>
                <Ionicons name="cash-outline" size={22} color="#059669" />
                <Text style={[styles.summaryValue, { color: "#059669" }]}>{payments.length}</Text>
                <Text style={styles.summaryLabel}>Payments</Text>
              </View>
            </View>
          )}

          {/* Properties / Bookings */}
          {(selectedTab === "all" || selectedTab === "properties") && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>My Bookings</Text>
              {bookings.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="home-search-outline" size={40} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No bookings yet</Text>
                  <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/tenant/browse-properties" as any)}>
                    <Text style={styles.browseBtnText}>Browse Properties</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                bookings.map((b) => (
                  <View key={b.id} style={styles.itemCard}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(b.status) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{b.property_name}</Text>
                      <Text style={styles.itemSub}>{b.property_address}</Text>
                      <Text style={styles.itemMeta}>Move-in: {b.move_in} · {b.lease_duration}</Text>
                    </View>
                    <View style={styles.itemRight}>
                      <View style={[styles.badge, { backgroundColor: getStatusBg(b.status) }]}>
                        <Text style={[styles.badgeText, { color: getStatusColor(b.status) }]}>
                          {b.status}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>₱{Number(b.property_price).toLocaleString()}/mo</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Payments */}
          {(selectedTab === "all" || selectedTab === "payments") && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Payment History</Text>
              {payments.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="card-outline" size={40} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No payments recorded yet</Text>
                </View>
              ) : (
                payments.map((p) => (
                  <View key={p.id} style={styles.itemCard}>
                    <View style={[styles.methodIcon, { backgroundColor: "#EFF6FF" }]}>
                      <Ionicons
                        name={p.method === "gcash" ? "phone-portrait" : p.method === "card" ? "card" : p.method === "bank_transfer" ? "business" : "cash"}
                        size={18}
                        color="#2563EB"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{p.property_name}</Text>
                      <Text style={styles.itemMeta}>TXN: {p.transaction_id}</Text>
                      <Text style={styles.itemMeta}>{new Date(p.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.paymentAmount}>₱{Number(p.amount).toLocaleString()}</Text>
                      <View style={[styles.badge, { backgroundColor: p.status === "paid" ? "#D1FAE5" : "#FEF3C7" }]}>
                        <Text style={[styles.badgeText, { color: p.status === "paid" ? "#059669" : "#D97706" }]}>
                          {p.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Contracts */}
          {(selectedTab === "all" || selectedTab === "contracts") && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Contracts</Text>
              {approvedBookings.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="file-document-outline" size={40} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No active contracts yet</Text>
                  <Text style={styles.emptySubText}>Contracts are created once your booking is approved</Text>
                </View>
              ) : (
                approvedBookings.map((b) => (
                  <View key={b.id} style={styles.itemCard}>
                    <View style={[styles.methodIcon, { backgroundColor: "#F0FDF4" }]}>
                      <MaterialCommunityIcons name="file-document-outline" size={18} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{b.property_name}</Text>
                      <Text style={styles.itemSub}>{b.property_address}</Text>
                      <Text style={styles.itemMeta}>Move-in: {b.move_in} · {b.lease_duration}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: "#D1FAE5" }]}>
                      <Text style={[styles.badgeText, { color: "#059669" }]}>Active</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  backButton: { marginRight: 12, padding: 4 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 12, color: "#64748B", marginTop: 1 },
  refreshBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  tabContainer: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  tabContentContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9" },
  tabActive: { backgroundColor: "#1D4ED8" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#fff" },
  center: { alignItems: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
  content: { flex: 1 },
  summaryRow: { flexDirection: "row", gap: 10, padding: 14, paddingBottom: 4 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 4 },
  summaryValue: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 11, color: "#64748B", textAlign: "center" },
  sectionCard: { backgroundColor: "#fff", margin: 12, borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
  emptyBox: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14, color: "#94A3B8", fontWeight: "600" },
  emptySubText: { fontSize: 12, color: "#CBD5E1", textAlign: "center" },
  browseBtn: { backgroundColor: "#1D4ED8", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  browseBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  itemCard: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#F8FAFC", borderRadius: 10, marginBottom: 8, gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  methodIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  itemSub: { fontSize: 12, color: "#64748B", marginTop: 1 },
  itemMeta: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  itemRight: { alignItems: "flex-end", gap: 4 },
  itemPrice: { fontSize: 12, fontWeight: "700", color: "#1E293B" },
  paymentAmount: { fontSize: 14, fontWeight: "800", color: "#1D4ED8" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
});
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import API_ENDPOINTS from "../../config/api";

interface Payment {
  id: number;
  booking_id: number;
  tenant_name: string;
  tenant_email: string;
  owner_name: string;
  property_name: string;
  amount: number;
  payment_method: string;
  status: "pending" | "completed" | "failed" | "released";
  created_at: string;
  reference_number?: string;
}

export default function AdminPayments() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "released">("all");
  const [search, setSearch] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_PAYMENTS}?admin=1&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") setPayments(data.data ?? []);
      else Alert.alert("Error", data.message || "Could not load payments.");
    } catch {
      Alert.alert("Connection Error", "Cannot reach server. Check your network.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const filtered = payments.filter((p) => {
    const matchFilter = filter === "all" || p.status === filter;
    const q = search.toLowerCase();
    return matchFilter && (!q ||
      (p.tenant_name || "").toLowerCase().includes(q) ||
      (p.property_name || "").toLowerCase().includes(q) ||
      (p.reference_number || "").toLowerCase().includes(q));
  });

  const totalRevenue = payments.filter(p => p.status === "completed" || p.status === "released")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingCount = payments.filter(p => p.status === "pending").length;

  const getStatusColor = (s: string) => {
    if (s === "completed" || s === "released") return "#059669";
    if (s === "pending") return "#D97706";
    return "#DC2626";
  };
  const getStatusBg = (s: string) => {
    if (s === "completed" || s === "released") return "#D1FAE5";
    if (s === "pending") return "#FEF3C7";
    return "#FEE2E2";
  };

  const getMethodIcon = (m: string) => {
    if (m === "gcash") return "phone-portrait-outline";
    if (m === "card") return "card-outline";
    if (m === "bank_transfer") return "business-outline";
    return "cash-outline";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>{payments.length} total transactions</Text>
        </View>
        <TouchableOpacity onPress={() => { setLoading(true); fetchPayments(); }} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {/* Revenue Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#F0FDF4", flex: 2 }]}>
          <MaterialCommunityIcons name="cash-multiple" size={20} color="#059669" />
          <Text style={[styles.summaryValue, { color: "#059669" }]}>₱{totalRevenue.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#FEF3C7" }]}>
          <Ionicons name="time-outline" size={20} color="#D97706" />
          <Text style={[styles.summaryValue, { color: "#D97706" }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#EFF6FF" }]}>
          <Ionicons name="receipt-outline" size={20} color="#2563EB" />
          <Text style={[styles.summaryValue, { color: "#2563EB" }]}>{payments.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tenant, property or ref no..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94A3B8"
        />
        {!!search && <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color="#94A3B8" /></TouchableOpacity>}
      </View>

      <View style={styles.tabsRow}>
        {(["all", "pending", "completed", "released"] as const).map((f) => (
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
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No payments found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.methodIcon}>
                  <Ionicons name={getMethodIcon(item.payment_method) as any} size={20} color="#1D4ED8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.propertyName} numberOfLines={1}>{item.property_name || "Property"}</Text>
                  <Text style={styles.tenantName}>{item.tenant_name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBottom}>
                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={13} color="#64748B" />
                  <Text style={styles.infoText}>₱{Number(item.amount).toLocaleString()}</Text>
                  <View style={styles.methodChip}>
                    <Text style={styles.methodChipText}>{(item.payment_method || "cash").replace("_", " ").toUpperCase()}</Text>
                  </View>
                </View>
                {item.reference_number && (
                  <View style={styles.infoRow}>
                    <Ionicons name="barcode-outline" size={13} color="#64748B" />
                    <Text style={styles.infoText}>Ref: {item.reference_number}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={13} color="#64748B" />
                  <Text style={styles.infoText}>Owner: {item.owner_name || "—"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={13} color="#64748B" />
                  <Text style={styles.infoText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
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
  header: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, paddingTop: 18, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 12, color: "#64748B" },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", gap: 10, padding: 14, paddingBottom: 4 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 4 },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { fontSize: 11, color: "#64748B" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 12, marginBottom: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1.5, borderColor: "#E2E8F0" },
  searchInput: { flex: 1, fontSize: 13, color: "#1E293B" },
  tabsRow: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F1F5F9" },
  tabActive: { backgroundColor: "#1D4ED8" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#fff" },
  center: { alignItems: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#64748B" },
  listContent: { padding: 14, paddingBottom: 32 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#94A3B8" },
  card: { backgroundColor: "#fff", borderRadius: 14, marginBottom: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  methodIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  propertyName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  tenantName: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginHorizontal: 14 },
  cardBottom: { padding: 14, gap: 6 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 12, color: "#475569", flex: 1 },
  methodChip: { backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  methodChipText: { fontSize: 10, fontWeight: "700", color: "#64748B" },
});
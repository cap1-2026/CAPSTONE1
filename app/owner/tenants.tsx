import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

interface Tenant {
  id: number;
  tenant_name: string;
  tenant_email: string;
  phone?: string;
  property_name: string;
  property_address: string;
  property_price: number;
  move_in: string;
  lease_duration: string;
  status: string;
  created_at: string;
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");

  const fetchTenants = useCallback(async (ownerId: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_BOOKINGS}?owner_id=${ownerId}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") {
        setTenants(data.data ?? []);
      } else {
        Alert.alert("Error", data.message || "Failed to load tenants.");
      }
    } catch {
      Alert.alert("Connection Error", "Cannot reach server. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    UserStorage.getUser().then((user) => {
      if (user) fetchTenants(user.user_id);
      else setLoading(false);
    });
  }, [fetchTenants]);

  function onRefresh() {
    setRefreshing(true);
    UserStorage.getUser().then((user) => { if (user) fetchTenants(user.user_id); });
  }

  const filtered = tenants.filter((t) => {
    const matchesFilter = filter === "all" || t.status === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (t.tenant_name || "").toLowerCase().includes(q) ||
      (t.tenant_email || "").toLowerCase().includes(q) ||
      (t.property_name || "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tenants</Text>
        <Text style={styles.subtitle}>{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or property..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
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
          <Text style={styles.loadingText}>Loading tenants...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No tenants found</Text>
              <Text style={styles.emptySub}>
                {filter === "all" ? "No booking records yet." : `No ${filter} bookings.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Status */}
              <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>

              {/* Tenant Info */}
              <Text style={styles.tenantName}>{item.tenant_name}</Text>
              <Text style={styles.tenantEmail}>{item.tenant_email}</Text>

              <View style={styles.divider} />

              {/* Property Info */}
              <View style={styles.infoRow}>
                <Ionicons name="home-outline" size={14} color="#64748B" />
                <Text style={styles.infoText}>{item.property_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={14} color="#64748B" />
                <Text style={styles.infoText}>{item.property_address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={14} color="#64748B" />
                <Text style={styles.infoText}>₱{Number(item.property_price).toLocaleString()} / month</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text style={styles.infoText}>Move-in: {item.move_in} · {item.lease_duration}</Text>
              </View>

              <Text style={styles.submittedDate}>
                Submitted {new Date(item.created_at).toLocaleDateString()}
              </Text>
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
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1.5, borderColor: "#E2E8F0" },
  searchInput: { flex: 1, fontSize: 14, color: "#1E293B" },
  tabsRow: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F1F5F9" },
  tabActive: { backgroundColor: "#1D4ED8" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#fff" },
  center: { alignItems: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#94A3B8", marginTop: 14 },
  emptySub: { fontSize: 13, color: "#CBD5E1", marginTop: 6, textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  statusText: { fontSize: 11, fontWeight: "700" },
  tenantName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  tenantEmail: { fontSize: 13, color: "#64748B", marginTop: 2, marginBottom: 4 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 },
  infoText: { fontSize: 13, color: "#475569", flex: 1 },
  submittedDate: { fontSize: 11, color: "#94A3B8", marginTop: 8 },
});
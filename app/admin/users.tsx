import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import API_ENDPOINTS from "../../config/api";

interface User {
  user_id: number;
  fullname: string;
  email: string;
  role: "owner" | "tenant";
  created_at: string;
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "owner" | "tenant">("all");
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_USERS}?_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") setUsers(data.data ?? []);
      else Alert.alert("Error", data.message || "Could not load users.");
    } catch {
      Alert.alert("Connection Error", "Cannot reach server. Check your network.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const matchFilter = filter === "all" || u.role === filter;
    const q = search.toLowerCase();
    return matchFilter && (!q ||
      (u.fullname || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q));
  });

  const ownerCount = users.filter(u => u.role === "owner").length;
  const tenantCount = users.filter(u => u.role === "tenant").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>{users.length} registered users</Text>
        </View>
        <TouchableOpacity onPress={() => { setLoading(true); fetchUsers(); }} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#F5F3FF" }]}>
          <Ionicons name="key-outline" size={20} color="#7C3AED" />
          <Text style={[styles.summaryValue, { color: "#7C3AED" }]}>{ownerCount}</Text>
          <Text style={styles.summaryLabel}>Owners</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#EFF6FF" }]}>
          <Ionicons name="person-outline" size={20} color="#2563EB" />
          <Text style={[styles.summaryValue, { color: "#2563EB" }]}>{tenantCount}</Text>
          <Text style={styles.summaryLabel}>Tenants</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#F0FDF4" }]}>
          <Ionicons name="people-outline" size={20} color="#059669" />
          <Text style={[styles.summaryValue, { color: "#059669" }]}>{users.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94A3B8"
        />
        {!!search && <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color="#94A3B8" /></TouchableOpacity>}
      </View>

      <View style={styles.tabsRow}>
        {(["all", "owner", "tenant"] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.tabActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f === "all" ? "All" : f === "owner" ? "Owners" : "Tenants"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.user_id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No users found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: item.role === "owner" ? "#F5F3FF" : "#EFF6FF" }]}>
                <Text style={styles.avatarText}>{(item.fullname || "?").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{item.fullname}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userDate}>Joined {new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: item.role === "owner" ? "#F5F3FF" : "#EFF6FF" }]}>
                <Ionicons name={item.role === "owner" ? "key-outline" : "person-outline"} size={12} color={item.role === "owner" ? "#7C3AED" : "#2563EB"} />
                <Text style={[styles.roleText, { color: item.role === "owner" ? "#7C3AED" : "#2563EB" }]}>
                  {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
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
  header: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, paddingTop: 18, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 12, color: "#64748B" },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", gap: 10, padding: 14, paddingBottom: 4 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 4 },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { fontSize: 11, color: "#64748B" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 12, marginBottom: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1.5, borderColor: "#E2E8F0" },
  searchInput: { flex: 1, fontSize: 13, color: "#1E293B" },
  tabsRow: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F1F5F9" },
  tabActive: { backgroundColor: "#1D4ED8" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#fff" },
  center: { alignItems: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#64748B" },
  listContent: { padding: 14, paddingBottom: 32 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#94A3B8" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  userName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  userEmail: { fontSize: 12, color: "#64748B", marginTop: 1 },
  userDate: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: "700" },
});
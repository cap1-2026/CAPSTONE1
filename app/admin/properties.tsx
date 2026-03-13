
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import API_ENDPOINTS, { API_BASE_URL } from "../../config/api";

interface Property {
  id: number;
  name: string;
  property_type: string;
  address: string;
  price: number;
  owner_name: string;
  owner_email: string;
  first_image?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function AdminProperties() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_PROPERTIES}?admin=1&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") setProperties(data.data ?? []);
    } catch {
      Alert.alert("Error", "Could not load properties.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  async function handleAction(propertyId: number, action: "approved" | "rejected", name: string) {
    Alert.alert(
      action === "approved" ? "Approve Property" : "Reject Property",
      `${action === "approved" ? "Approve" : "Reject"} "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "approved" ? "Approve" : "Reject",
          style: action === "rejected" ? "destructive" : "default",
          onPress: async () => {
            setActionLoading(propertyId);
            try {
              const res = await fetch(API_ENDPOINTS.APPROVE_PROPERTY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ property_id: propertyId, action }),
              });
              const data = await res.json();
              if (data.status === "success") {
                setProperties(prev =>
                  prev.map(p => p.id === propertyId ? { ...p, status: action } : p)
                );
              } else {
                Alert.alert("Failed", data.message ?? "Please try again.");
              }
            } catch {
              Alert.alert("Error", "Could not process request.");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }

  const filtered = properties.filter((p) => {
    const matchFilter = filter === "all" || p.status === filter;
    const q = search.toLowerCase();
    return matchFilter && (!q ||
      (p.name || "").toLowerCase().includes(q) ||
      (p.owner_name || "").toLowerCase().includes(q) ||
      (p.address || "").toLowerCase().includes(q));
  });

  const counts = {
    all: properties.length,
    pending: properties.filter(p => p.status === "pending").length,
    approved: properties.filter(p => p.status === "approved").length,
    rejected: properties.filter(p => p.status === "rejected").length,
  };

  const getStatusColor = (s: string) => s === "approved" ? "#059669" : s === "pending" ? "#D97706" : "#DC2626";
  const getStatusBg = (s: string) => s === "approved" ? "#D1FAE5" : s === "pending" ? "#FEF3C7" : "#FEE2E2";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>All Properties</Text>
          <Text style={styles.subtitle}>{properties.length} total listings</Text>
        </View>
        <TouchableOpacity onPress={() => { setLoading(true); fetchProperties(); }} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, owner or address..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94A3B8"
        />
        {!!search && <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color="#94A3B8" /></TouchableOpacity>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.tabActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
            <View style={[styles.tabBadge, filter === f && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, filter === f && styles.tabBadgeTextActive]}>{counts[f]}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProperties(); }} />}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="home-search-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No properties found</Text>
            </View>
          ) : filtered.map((p) => (
            <View key={p.id} style={styles.card}>
              {p.first_image
                ? <Image source={{ uri: `${API_BASE_URL}/${p.first_image}` }} style={styles.cardImage} resizeMode="cover" />
                : <View style={[styles.cardImage, styles.noImage]}><Text style={{ fontSize: 40 }}>🏢</Text></View>
              }
              <View style={[styles.statusBadge, { backgroundColor: getStatusBg(p.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(p.status) }]}>{p.status.toUpperCase()}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.rowBetween}>
                  <View style={styles.typeChip}><Text style={styles.typeChipText}>{p.property_type || "Property"}</Text></View>
                  <Text style={styles.dateText}>{new Date(p.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.propertyName}>{p.name}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={13} color="#64748B" />
                  <Text style={styles.infoText}>{p.address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={13} color="#64748B" />
                  <Text style={styles.infoText}>₱{Number(p.price).toLocaleString()} / month</Text>
                </View>
                <View style={styles.ownerBox}>
                  <Ionicons name="person-circle-outline" size={15} color="#1D4ED8" />
                  <Text style={styles.ownerText} numberOfLines={1}>
                    {p.owner_name || "Unknown Owner"}{p.owner_email ? `  ·  ${p.owner_email}` : ""}
                  </Text>
                </View>
                {p.status === "pending" && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(p.id, "rejected", p.name)} disabled={actionLoading === p.id}>
                      {actionLoading === p.id
                        ? <ActivityIndicator size="small" color="#DC2626" />
                        : <><Ionicons name="close-circle-outline" size={15} color="#DC2626" /><Text style={styles.rejectBtnText}>Reject</Text></>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(p.id, "approved", p.name)} disabled={actionLoading === p.id}>
                      {actionLoading === p.id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <><Ionicons name="checkmark-circle-outline" size={15} color="#fff" /><Text style={styles.approveBtnText}>Approve</Text></>}
                    </TouchableOpacity>
                  </View>
                )}
                {p.status !== "pending" && (
                  <View style={[styles.decidedRow, { backgroundColor: getStatusBg(p.status) }]}>
                    <Ionicons name={p.status === "approved" ? "checkmark-circle" : "close-circle"} size={14} color={getStatusColor(p.status)} />
                    <Text style={[styles.decidedText, { color: getStatusColor(p.status) }]}>This property has been {p.status}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
          <View style={{ height: 30 }} />
        </ScrollView>
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
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 12, marginBottom: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1.5, borderColor: "#E2E8F0" },
  searchInput: { flex: 1, fontSize: 13, color: "#1E293B" },
  tabsScroll: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  tabs: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F1F5F9" },
  tabActive: { backgroundColor: "#1D4ED8" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#fff" },
  tabBadge: { backgroundColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: "#64748B" },
  tabBadgeTextActive: { color: "#fff" },
  center: { alignItems: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#64748B" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#94A3B8" },
  card: { backgroundColor: "#fff", marginHorizontal: 14, marginTop: 14, borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardImage: { width: "100%", height: 150 },
  noImage: { backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  statusBadge: { position: "absolute", top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700" },
  cardBody: { padding: 14 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeChip: { backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  typeChipText: { fontSize: 11, color: "#2563EB", fontWeight: "600" },
  dateText: { fontSize: 11, color: "#94A3B8" },
  propertyName: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  infoText: { fontSize: 12, color: "#475569", flex: 1 },
  ownerBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EFF6FF", borderRadius: 8, padding: 8, marginTop: 8 },
  ownerText: { fontSize: 12, color: "#1D4ED8", fontWeight: "500", flex: 1 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: 10, backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA" },
  rejectBtnText: { color: "#DC2626", fontSize: 13, fontWeight: "700" },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: 10, backgroundColor: "#059669" },
  approveBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  decidedRow: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, padding: 8, marginTop: 10 },
  decidedText: { fontSize: 12, fontWeight: "600" },
});
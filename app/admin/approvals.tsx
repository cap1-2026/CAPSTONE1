// app/admin/approvals.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";

// ⚠️ UPDATE THIS TO YOUR COMPUTER'S IP ADDRESS
const BASE = "http://192.168.0.131/Caps";

interface Property {
  id: number;
  name: string;
  property_type: string;
  address: string;
  price: number;
  deposit: number;
  rooms: number;
  amenities: string;
  owner_name: string;
  owner_email: string;
  first_image?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function AdminApprovals() {
  const router = useRouter();
  const [properties, setProperties]       = useState<Property[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch]               = useState("");
  const [filter, setFilter]               = useState<"pending" | "all">("pending");

  const fetchProperties = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE}/get_properties.php?admin=1&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") {
        setProperties(data.data ?? []);
      } else {
        Alert.alert("Error", data.message || "Could not load properties.");
      }
    } catch (e: any) {
      Alert.alert("Connection Error", `Cannot reach server.\n${e?.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  async function handleAction(property: Property, action: "approved" | "rejected") {
    const label = action === "approved" ? "Approve" : "Reject";
    Alert.alert(
      `${label} Property`,
      `${label} "${property.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: label,
          style: action === "rejected" ? "destructive" : "default",
          onPress: async () => {
            setActionLoading(property.id);
            try {
              const res = await fetch(`${BASE}/approve_property.php`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ property_id: property.id, action }),
              });

              // Read raw text first to catch non-JSON responses
              const text = await res.text();
              let data: any = {};
              try {
                data = JSON.parse(text);
              } catch {
                Alert.alert("Server Error", `Unexpected response:\n${text.slice(0, 300)}`);
                setActionLoading(null);
                return;
              }

              if (data.status === "success") {
                setProperties((prev) =>
                  prev.map((p) => p.id === property.id ? { ...p, status: action } : p)
                );
                Alert.alert("✅ Done", `Property has been ${action}.`);
              } else {
                Alert.alert("Failed", `Server: ${data.message ?? "Unknown error"}`);
              }
            } catch (e: any) {
              Alert.alert("Network Error", `${e?.message}`);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }

  const filtered = properties.filter((p) => {
    const matchStatus = filter === "all" || p.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (p.name       || "").toLowerCase().includes(q) ||
      (p.owner_name || "").toLowerCase().includes(q) ||
      (p.address    || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingCount  = properties.filter((p) => p.status === "pending").length;
  const approvedCount = properties.filter((p) => p.status === "approved").length;
  const rejectedCount = properties.filter((p) => p.status === "rejected").length;

  const statusColor = (s: string) =>
    s === "approved" ? "#059669" : s === "pending" ? "#D97706" : "#DC2626";
  const statusBg = (s: string) =>
    s === "approved" ? "#D1FAE5" : s === "pending" ? "#FEF3C7" : "#FEE2E2";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Property Approvals</Text>
          <Text style={styles.subtitle}>
            {pendingCount > 0 ? `${pendingCount} awaiting review` : "All reviewed"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => { setLoading(true); fetchProperties(); }} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#FEF3C7" }]}>
          <Ionicons name="time-outline" size={18} color="#D97706" />
          <Text style={[styles.summaryNum, { color: "#D97706" }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#D1FAE5" }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
          <Text style={[styles.summaryNum, { color: "#059669" }]}>{approvedCount}</Text>
          <Text style={styles.summaryLabel}>Approved</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#FEE2E2" }]}>
          <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
          <Text style={[styles.summaryNum, { color: "#DC2626" }]}>{rejectedCount}</Text>
          <Text style={styles.summaryLabel}>Rejected</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, owner or address..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94A3B8"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(["pending", "all"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.tab, filter === f && styles.tabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f === "pending" ? `Pending (${pendingCount})` : `All (${properties.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProperties(); }} colors={["#1D4ED8"]} />}
          contentContainerStyle={styles.list}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="home-search-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {filter === "pending" ? "No pending properties" : "No properties found"}
              </Text>
            </View>
          ) : (
            filtered.map((p) => (
              <View key={p.id} style={styles.card}>
                {p.first_image ? (
                  <Image source={{ uri: `${BASE}/${p.first_image}` }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImage, styles.noImage]}>
                    <Text style={{ fontSize: 44 }}>🏢</Text>
                  </View>
                )}

                <View style={[styles.statusBadge, { backgroundColor: statusBg(p.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(p.status) }]}>
                    {p.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.rowBetween}>
                    <View style={styles.typeChip}>
                      <Text style={styles.typeChipText}>{p.property_type || "Property"}</Text>
                    </View>
                    <Text style={styles.dateText}>{new Date(p.created_at).toLocaleDateString()}</Text>
                  </View>

                  <Text style={styles.propName}>{p.name}</Text>

                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={13} color="#64748B" />
                    <Text style={styles.infoText}>{p.address}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={13} color="#64748B" />
                    <Text style={styles.infoText}>
                      ₱{Number(p.price).toLocaleString()} / month
                      {p.deposit > 0 ? `  ·  ₱${Number(p.deposit).toLocaleString()} deposit` : ""}
                    </Text>
                  </View>

                  {(p.rooms > 0 || p.amenities) ? (
                    <View style={styles.infoRow}>
                      <Ionicons name="bed-outline" size={13} color="#64748B" />
                      <Text style={styles.infoText}>
                        {p.rooms} room{p.rooms !== 1 ? "s" : ""}
                        {p.amenities ? `  ·  ${p.amenities}` : ""}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.ownerBox}>
                    <Ionicons name="person-circle-outline" size={15} color="#1D4ED8" />
                    <Text style={styles.ownerText} numberOfLines={1}>
                      {p.owner_name || "Unknown Owner"}
                      {p.owner_email ? `  ·  ${p.owner_email}` : ""}
                    </Text>
                  </View>

                  {/* ACTION BUTTONS - only for pending */}
                  {p.status === "pending" && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleAction(p, "rejected")}
                        disabled={actionLoading === p.id}
                      >
                        {actionLoading === p.id
                          ? <ActivityIndicator size="small" color="#DC2626" />
                          : <><Ionicons name="close-circle-outline" size={16} color="#DC2626" /><Text style={styles.rejectBtnText}>Reject</Text></>}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleAction(p, "approved")}
                        disabled={actionLoading === p.id}
                      >
                        {actionLoading === p.id
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <><Ionicons name="checkmark-circle-outline" size={16} color="#fff" /><Text style={styles.approveBtnText}>Approve</Text></>}
                      </TouchableOpacity>
                    </View>
                  )}

                  {p.status !== "pending" && (
                    <View style={[styles.decidedRow, { backgroundColor: statusBg(p.status) }]}>
                      <Ionicons
                        name={p.status === "approved" ? "checkmark-circle" : "close-circle"}
                        size={14}
                        color={statusColor(p.status)}
                      />
                      <Text style={[styles.decidedText, { color: statusColor(p.status) }]}>
                        This property has been {p.status}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#F8FAFC" },
  header:        { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, paddingTop: 18, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 8 },
  backBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  title:         { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  subtitle:      { fontSize: 12, color: "#64748B", marginTop: 1 },
  refreshBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  summaryRow:    { flexDirection: "row", gap: 10, padding: 12, paddingBottom: 4 },
  summaryCard:   { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", gap: 3 },
  summaryNum:    { fontSize: 20, fontWeight: "800" },
  summaryLabel:  { fontSize: 11, color: "#64748B" },
  searchRow:     { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 12, marginBottom: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1.5, borderColor: "#E2E8F0" },
  searchInput:   { flex: 1, fontSize: 13, color: "#1E293B" },
  tabsRow:       { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  tab:           { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9" },
  tabActive:     { backgroundColor: "#1D4ED8" },
  tabText:       { fontSize: 12, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#fff" },
  center:        { alignItems: "center", paddingVertical: 80 },
  loadingText:   { marginTop: 12, color: "#64748B" },
  list:          { paddingHorizontal: 14 },
  empty:         { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle:    { fontSize: 18, fontWeight: "700", color: "#94A3B8", marginTop: 8 },
  card:          { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardImage:     { width: "100%", height: 160 },
  noImage:       { backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  statusBadge:   { position: "absolute", top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText:    { fontSize: 10, fontWeight: "700" },
  cardBody:      { padding: 14 },
  rowBetween:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeChip:      { backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  typeChipText:  { fontSize: 11, color: "#2563EB", fontWeight: "600" },
  dateText:      { fontSize: 11, color: "#94A3B8" },
  propName:      { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  infoRow:       { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 5 },
  infoText:      { fontSize: 12, color: "#475569", flex: 1 },
  ownerBox:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EFF6FF", borderRadius: 8, padding: 8, marginTop: 6 },
  ownerText:     { fontSize: 12, color: "#1D4ED8", fontWeight: "500", flex: 1 },
  actionRow:     { flexDirection: "row", gap: 10, marginTop: 14 },
  rejectBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA" },
  rejectBtnText: { color: "#DC2626", fontSize: 13, fontWeight: "700" },
  approveBtn:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: "#059669" },
  approveBtnText:{ color: "#fff", fontSize: 13, fontWeight: "700" },
  decidedRow:    { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, padding: 8, marginTop: 10 },
  decidedText:   { fontSize: 12, fontWeight: "600" },
});
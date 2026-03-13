import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import API_ENDPOINTS, { API_BASE_URL } from "../../config/api";

interface Property {
  id: number;
  name: string;
  property_type: string;
  address: string;
  price: number;
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
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_PROPERTIES}?admin=1&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") {
        setProperties(data.data ?? []);
      } else {
        Alert.alert("Error", data.message || "Failed to load properties.");
      }
    } catch {
      Alert.alert("Connection Error", "Cannot reach server. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  function onRefresh() {
    setRefreshing(true);
    fetchProperties();
  }

  async function handleAction(propertyId: number, action: "approved" | "rejected", propertyName: string) {
    const label = action === "approved" ? "Approve" : "Reject";
    Alert.alert(
      `${label} Property`,
      `Are you sure you want to ${label.toLowerCase()} "${propertyName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: label,
          style: action === "rejected" ? "destructive" : "default",
          onPress: async () => {
            setActionLoading(propertyId);
            try {
              const res = await fetch(API_ENDPOINTS.APPROVE_PROPERTY ?? `${API_BASE_URL}/api/approve_property.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ property_id: propertyId, action }),
              });
              const data = await res.json();
              if (data.status === "success") {
                setProperties((prev) =>
                  prev.map((p) => p.id === propertyId ? { ...p, status: action } : p)
                );
                Alert.alert("Done", `Property ${action} successfully.`);
              } else {
                Alert.alert("Failed", data.message ?? "Please try again.");
              }
            } catch {
              Alert.alert("Error", "Could not process request. Check your connection.");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }

  const filteredProperties = properties.filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  const pendingCount = properties.filter((p) => p.status === "pending").length;

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
        <View>
          <Text style={styles.headerTitle}>Property Approvals</Text>
          <Text style={styles.headerSub}>
            {pendingCount > 0 ? `${pendingCount} pending review` : "All caught up!"}
          </Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.tab, filter === f && styles.tabActive]}
            onPress={() => setFilter(f)}
          >
            {f === "pending" && pendingCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{pendingCount}</Text></View>
            )}
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredProperties.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="home-search-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No {filter} properties</Text>
              <Text style={styles.emptySub}>
                {filter === "pending" ? "No properties awaiting approval." : `No ${filter} listings found.`}
              </Text>
            </View>
          ) : (
            filteredProperties.map((property) => (
              <View key={property.id} style={styles.card}>
                {/* Image */}
                {property.first_image ? (
                  <Image
                    source={{ uri: `${API_BASE_URL}/${property.first_image}` }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cardImage, styles.imagePlaceholder]}>
                    <Text style={styles.imagePlaceholderIcon}>🏢</Text>
                  </View>
                )}

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(property.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(property.status) }]}>
                    {property.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  {/* Property Info */}
                  <View style={styles.propertyHeader}>
                    <View style={styles.typeChip}>
                      <Text style={styles.typeChipText}>{property.property_type || "Property"}</Text>
                    </View>
                    <Text style={styles.dateText}>
                      Submitted {new Date(property.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <Text style={styles.propertyName}>{property.name}</Text>

                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.infoText}>{property.address}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="cash" size={14} color="#64748B" />
                    <Text style={styles.infoText}>₱{Number(property.price).toLocaleString()} / month</Text>
                  </View>

                  {property.amenities ? (
                    <View style={styles.infoRow}>
                      <Ionicons name="checkmark-circle-outline" size={14} color="#64748B" />
                      <Text style={styles.infoText} numberOfLines={1}>{property.amenities}</Text>
                    </View>
                  ) : null}

                  {/* Owner Info */}
                  <View style={styles.ownerBox}>
                    <Ionicons name="person-outline" size={14} color="#1D4ED8" />
                    <Text style={styles.ownerText}>
                      {property.owner_name || "Unknown Owner"}
                      {property.owner_email ? ` · ${property.owner_email}` : ""}
                    </Text>
                  </View>

                  {/* Action Buttons — only for pending */}
                  {property.status === "pending" && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleAction(property.id, "rejected", property.name)}
                        disabled={actionLoading === property.id}
                      >
                        {actionLoading === property.id ? (
                          <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                          <>
                            <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handleAction(property.id, "approved", property.name)}
                        disabled={actionLoading === property.id}
                      >
                        {actionLoading === property.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                            <Text style={styles.approveBtnText}>Approve</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Already decided */}
                  {property.status !== "pending" && (
                    <View style={[styles.decidedBox, { backgroundColor: getStatusBg(property.status) }]}>
                      <Ionicons
                        name={property.status === "approved" ? "checkmark-circle" : "close-circle"}
                        size={16}
                        color={getStatusColor(property.status)}
                      />
                      <Text style={[styles.decidedText, { color: getStatusColor(property.status) }]}>
                        This property has been {property.status}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  tabsScroll: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  tabs: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9", flexDirection: "row", alignItems: "center", gap: 6 },
  tabActive: { backgroundColor: "#1D4ED8" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#fff" },
  badge: { backgroundColor: "#EF4444", borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
  list: { flex: 1 },
  empty: { alignItems: "center", paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#94A3B8", marginTop: 16 },
  emptySub: { fontSize: 14, color: "#CBD5E1", marginTop: 6, textAlign: "center" },
  card: { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 14, borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardImage: { width: "100%", height: 160, backgroundColor: "#E2E8F0" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  imagePlaceholderIcon: { fontSize: 52 },
  statusBadge: { position: "absolute", top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardBody: { padding: 14 },
  propertyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeChip: { backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeChipText: { fontSize: 12, color: "#2563EB", fontWeight: "600" },
  dateText: { fontSize: 11, color: "#94A3B8" },
  propertyName: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  infoText: { fontSize: 13, color: "#475569", flex: 1 },
  ownerBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EFF6FF", borderRadius: 8, padding: 8, marginTop: 8, marginBottom: 4 },
  ownerText: { fontSize: 12, color: "#1D4ED8", fontWeight: "500", flex: 1 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 10 },
  rejectBtn: { backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA" },
  rejectBtnText: { color: "#DC2626", fontSize: 14, fontWeight: "700" },
  approveBtn: { backgroundColor: "#059669" },
  approveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  decidedBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, padding: 10, marginTop: 10 },
  decidedText: { fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
});
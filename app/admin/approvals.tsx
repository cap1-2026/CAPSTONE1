// app/admin/approvals.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Modal, Platform, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import API_ENDPOINTS, { API_BASE_URL } from "../../config/api";

// Send a notification to a user after admin action
async function sendAdminNotification(
  userId: number,
  role: "owner" | "tenant",
  type: string,
  title: string,
  message: string,
  relatedId: number,
) {
  try {
    await fetch(API_ENDPOINTS.NOTIFICATIONS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        user_id: userId,
        user_role: role,
        type,
        title,
        message,
        related_id: relatedId,
        action_type: "approval",
      }),
    });
  } catch { /* non-critical */ }
}

interface Property {
  id: number;
  owner_id?: number;
  name: string;
  property_type: string;
  address: string;
  price: number;
  deposit: number;
  rooms: number;
  amenities: string;
  description?: string;
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
  const [filter, setFilter]               = useState<"pending" | "approved" | "rejected">("pending");

  // View Details modal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailsVisible, setDetailsVisible]     = useState(false);

  // Success banner
  const [banner, setBanner] = useState<{ message: string; approved: boolean } | null>(null);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 3500);
    return () => clearTimeout(t);
  }, [banner]);

  const fetchProperties = useCallback(async () => {
    try {
      const res  = await fetch(`${API_ENDPOINTS.GET_PROPERTIES}?admin=1&_t=${Date.now()}`);
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

    const doAction = async () => {
      setActionLoading(property.id);
      try {
        const res = await fetch(API_ENDPOINTS.APPROVE_PROPERTY, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ property_id: property.id, action }),
        });

        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch {
          Alert.alert("Server Error", `Unexpected response:\n${text.slice(0, 300)}`);
          setActionLoading(null);
          return;
        }

        if (data.status === "success") {
          setProperties((prev) =>
            prev.map((p) => p.id === property.id ? { ...p, status: action } : p)
          );
          setDetailsVisible(false);
          setSelectedProperty(null);
          setBanner({
            approved: action === "approved",
            message: action === "approved"
              ? `"${property.name}" approved — now live for tenants.`
              : `"${property.name}" rejected and hidden from tenants.`,
          });

          // Notify the property owner
          if (property.owner_id) {
            const ownerTitle   = action === "approved"
              ? "Property Approved!"
              : "Property Not Approved";
            const ownerMessage = action === "approved"
              ? `Your property "${property.name}" at ${property.address || "—"} has been approved by admin and is now live for tenants. Monthly Rent: ₱${Number(property.price).toLocaleString()} | Security Deposit: ₱${Number(property.deposit).toLocaleString()} | Rooms: ${property.rooms} | Amenities: ${property.amenities || "—"}`
              : `Your property "${property.name}" was not approved by admin. Please review your listing details and resubmit.`;
            sendAdminNotification(
              property.owner_id, "owner", "property",
              ownerTitle, ownerMessage, property.id,
            );
          }
        } else {
          Alert.alert("Failed", `Server: ${data.message ?? "Unknown error"}`);
        }
      } catch (e: any) {
        Alert.alert("Network Error", `${e?.message}`);
      } finally {
        setActionLoading(null);
      }
    };

    if (Platform.OS === "web") {
      // Alert.alert buttons don't work on Expo Web — use browser confirm instead
      if (window.confirm(`${label} "${property.name}"?`)) {
        await doAction();
      }
    } else {
      Alert.alert(
        `${label} Property`,
        `${label} "${property.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: label, style: action === "rejected" ? "destructive" : "default", onPress: doAction },
        ]
      );
    }
  }

  const filtered = properties.filter((p) => {
    const matchStatus = p.status === filter;
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

  function openDetails(p: Property) {
    setSelectedProperty(p);
    setDetailsVisible(true);
  }

  // ─── View Details Modal ─────────────────────────────────────────────────────
  const renderDetailsModal = () => {
    if (!selectedProperty) return null;
    const p = selectedProperty;
    const isProcessing = actionLoading === p.id;

    return (
      <Modal
        visible={detailsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View style={modal.container}>
          {/* Modal Header */}
          <View style={modal.header}>
            <TouchableOpacity onPress={() => setDetailsVisible(false)} style={modal.closeBtn}>
              <Ionicons name="chevron-down" size={22} color="#64748B" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={modal.headerTitle} numberOfLines={1}>Listing #{p.id}</Text>
              <Text style={modal.headerSub} numberOfLines={1}>{p.name}</Text>
            </View>
            <View style={[modal.statusChip, { backgroundColor: statusBg(p.status) }]}>
              <Ionicons
                name={p.status === "approved" ? "checkmark-circle" : p.status === "pending" ? "time" : "close-circle"}
                size={12}
                color={statusColor(p.status)}
              />
              <Text style={[modal.statusChipText, { color: statusColor(p.status) }]}>
                {p.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={modal.scrollContent} showsVerticalScrollIndicator={false}>

            {/* ── Hero Image ── */}
            {p.first_image ? (
              <Image
                source={{ uri: `${API_BASE_URL}/${p.first_image}` }}
                style={modal.image}
                resizeMode="cover"
              />
            ) : (
              <View style={[modal.image, modal.imagePlaceholder]}>
                <Ionicons name="image-outline" size={64} color="#CBD5E1" />
                <Text style={modal.noImageText}>No photo uploaded</Text>
              </View>
            )}

            {/* ── Identity ── */}
            <View style={modal.section}>
              <View style={modal.rowWrap}>
                <View style={modal.typeBadge}>
                  <Ionicons name="home-outline" size={11} color="#2563EB" />
                  <Text style={modal.typeBadgeText}>{p.property_type || "Property"}</Text>
                </View>
                <Text style={modal.listingId}>Listing #{p.id}</Text>
              </View>
              <Text style={modal.propName}>{p.name}</Text>
              <View style={modal.infoRow}>
                <Ionicons name="location-outline" size={14} color="#64748B" />
                <Text style={modal.infoText}>{p.address || "No address provided"}</Text>
              </View>
              <View style={modal.infoRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text style={modal.infoText}>
                  Submitted {new Date(p.created_at).toLocaleDateString("en-PH", { dateStyle: "long" })}
                </Text>
              </View>
            </View>

            {/* ── Pricing & Details ── */}
            <View style={modal.section}>
              <Text style={modal.sectionTitle}>PROPERTY DETAILS</Text>

              {/* Price highlight strip */}
              <View style={modal.priceStrip}>
                <View style={modal.priceBlock}>
                  <Text style={modal.priceLabel}>Monthly Rent</Text>
                  <Text style={modal.priceValue}>₱{Number(p.price).toLocaleString()}</Text>
                </View>
                <View style={modal.priceDivider} />
                <View style={modal.priceBlock}>
                  <Text style={modal.priceLabel}>Security Deposit</Text>
                  <Text style={[modal.priceValue, { color: "#1D4ED8" }]}>
                    {p.deposit > 0 ? `₱${Number(p.deposit).toLocaleString()}` : "None"}
                  </Text>
                </View>
              </View>

              {/* Detail rows */}
              <View style={modal.table}>
                {[
                  { icon: "business-outline",   label: "Property Type", value: p.property_type || "—" },
                  { icon: "bed-outline",         label: "Rooms",         value: p.rooms > 0 ? `${p.rooms} room${p.rooms !== 1 ? "s" : ""}` : "—" },
                  { icon: "star-outline",        label: "Amenities",     value: p.amenities || "—" },
                ].map((row, i) => (
                  <View key={i} style={[modal.tableRow, i % 2 === 0 && modal.tableRowAlt]}>
                    <View style={modal.tableLabelWrap}>
                      <Ionicons name={row.icon as any} size={13} color="#64748B" />
                      <Text style={modal.tableLabel}>{row.label}</Text>
                    </View>
                    <Text style={modal.tableValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Description ── */}
            {!!p.description && (
              <View style={modal.section}>
                <Text style={modal.sectionTitle}>DESCRIPTION</Text>
                <Text style={modal.descText}>{p.description}</Text>
              </View>
            )}

            {/* ── Owner Info ── */}
            <View style={modal.section}>
              <Text style={modal.sectionTitle}>OWNER INFORMATION</Text>
              <View style={modal.ownerCard}>
                <View style={modal.ownerAvatar}>
                  <Text style={modal.ownerAvatarText}>
                    {(p.owner_name || "?")[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modal.ownerName}>{p.owner_name || "Unknown owner"}</Text>
                  <View style={modal.infoRow}>
                    <Ionicons name="mail-outline" size={12} color="#64748B" />
                    <Text style={modal.ownerEmail}>{p.owner_email || "No email on file"}</Text>
                  </View>
                </View>
                <View style={modal.ownerBadge}>
                  <MaterialCommunityIcons name="account-tie" size={14} color="#1D4ED8" />
                  <Text style={modal.ownerBadgeText}>Owner</Text>
                </View>
              </View>
            </View>

            {/* ── Current Status ── */}
            <View style={[modal.statusInfoBox, { backgroundColor: statusBg(p.status), borderColor: statusColor(p.status) + "40" }]}>
              <Ionicons
                name={p.status === "approved" ? "checkmark-circle" : p.status === "pending" ? "time" : "close-circle"}
                size={20}
                color={statusColor(p.status)}
              />
              <View style={{ flex: 1 }}>
                <Text style={[modal.statusInfoLabel, { color: statusColor(p.status) }]}>
                  {p.status === "approved" ? "LIVE" : p.status === "pending" ? "PENDING REVIEW" : "REJECTED"}
                </Text>
                <Text style={[modal.statusInfoText, { color: statusColor(p.status) }]}>
                  {p.status === "approved"
                    ? "Visible to tenants and accepting bookings."
                    : p.status === "pending"
                    ? "Not yet visible to tenants. Awaiting admin review."
                    : "Hidden from tenants. Owner has been notified."}
                </Text>
              </View>
            </View>

            {/* ── Approve / Reject (pending only) ── */}
            {p.status === "pending" && (
              <View style={modal.actionRow}>
                <TouchableOpacity
                  style={modal.rejectBtn}
                  onPress={() => handleAction(p, "rejected")}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? <ActivityIndicator size="small" color="#DC2626" />
                    : (<><Ionicons name="close-circle-outline" size={18} color="#DC2626" /><Text style={modal.rejectBtnText}>Reject</Text></>)}
                </TouchableOpacity>
                <TouchableOpacity
                  style={modal.approveBtn}
                  onPress={() => handleAction(p, "approved")}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (<><Ionicons name="checkmark-circle-outline" size={18} color="#fff" /><Text style={modal.approveBtnText}>Approve & Publish</Text></>)}
                </TouchableOpacity>
              </View>
            )}

            {/* ── Change decision if already decided ── */}
            {p.status !== "pending" && (
              <View style={modal.decidedBox}>
                <Text style={modal.decidedBoxText}>
                  This listing is currently{" "}
                  <Text style={{ fontWeight: "700", color: statusColor(p.status) }}>{p.status}</Text>.{" "}
                  Change decision?
                </Text>
                <View style={modal.actionRow}>
                  {p.status !== "rejected" && (
                    <TouchableOpacity style={modal.rejectBtn} onPress={() => handleAction(p, "rejected")} disabled={isProcessing}>
                      <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={modal.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  )}
                  {p.status !== "approved" && (
                    <TouchableOpacity style={modal.approveBtn} onPress={() => handleAction(p, "approved")} disabled={isProcessing}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                      <Text style={modal.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={{ height: 48 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // ─── Main Screen ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {renderDetailsModal()}

      {/* Success / Reject Banner */}
      {!!banner && (
        <View style={[styles.banner, banner.approved ? styles.bannerApproved : styles.bannerRejected]}>
          <Ionicons
            name={banner.approved ? "checkmark-circle" : "close-circle"}
            size={20}
            color="#fff"
          />
          <Text style={styles.bannerText}>{banner.message}</Text>
          <TouchableOpacity onPress={() => setBanner(null)}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      )}

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
        {([
          { key: "pending",  label: "Pending",  count: pendingCount  },
          { key: "approved", label: "Approved", count: approvedCount },
          { key: "rejected", label: "Rejected", count: rejectedCount },
        ] as { key: "pending"|"approved"|"rejected"; label: string; count: number }[]).map(({ key, label, count }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, filter === key && styles.tabActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.tabText, filter === key && styles.tabTextActive]}>
              {label} ({count})
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchProperties(); }}
              colors={["#1D4ED8"]}
            />
          }
          contentContainerStyle={styles.list}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="home-search-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {filter === "pending" ? "No pending properties" : `No ${filter} properties found`}
              </Text>
            </View>
          ) : (
            filtered.map((p) => (
              <View key={p.id} style={styles.card}>
                {p.first_image ? (
                  <Image source={{ uri: `${API_BASE_URL}/${p.first_image}` }} style={styles.cardImage} resizeMode="cover" />
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
                        {p.rooms > 0 ? `${p.rooms} room${p.rooms !== 1 ? "s" : ""}` : ""}
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

                  {/* View Details button */}
                  <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => openDetails(p)}>
                    <Ionicons name="eye-outline" size={15} color="#1D4ED8" />
                    <Text style={styles.viewDetailsBtnText}>View Full Details</Text>
                  </TouchableOpacity>
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

// ── List screen styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#F8FAFC" },
  banner:             { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 14, marginHorizontal: 14, marginTop: 10, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  bannerApproved:     { backgroundColor: "#059669" },
  bannerRejected:     { backgroundColor: "#DC2626" },
  bannerText:         { flex: 1, fontSize: 13, fontWeight: "600", color: "#fff", lineHeight: 18 },
  header:             { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, paddingTop: 18, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 8 },
  backBtn:            { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  title:              { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  subtitle:           { fontSize: 12, color: "#64748B", marginTop: 1 },
  refreshBtn:         { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  summaryRow:         { flexDirection: "row", gap: 10, padding: 12, paddingBottom: 4 },
  summaryCard:        { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", gap: 3 },
  summaryNum:         { fontSize: 20, fontWeight: "800" },
  summaryLabel:       { fontSize: 11, color: "#64748B" },
  searchRow:          { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 12, marginBottom: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1.5, borderColor: "#E2E8F0" },
  searchInput:        { flex: 1, fontSize: 13, color: "#1E293B" },
  tabsRow:            { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  tab:                { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9" },
  tabActive:          { backgroundColor: "#1D4ED8" },
  tabText:            { fontSize: 12, fontWeight: "600", color: "#64748B" },
  tabTextActive:      { color: "#fff" },
  center:             { alignItems: "center", paddingVertical: 80 },
  loadingText:        { marginTop: 12, color: "#64748B" },
  list:               { paddingHorizontal: 14 },
  empty:              { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle:         { fontSize: 18, fontWeight: "700", color: "#94A3B8", marginTop: 8 },
  card:               { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardImage:          { width: "100%", height: 200, backgroundColor: "#E2E8F0" },
  noImage:            { backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  statusBadge:        { position: "absolute", top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText:         { fontSize: 10, fontWeight: "700" },
  cardBody:           { padding: 14 },
  rowBetween:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeChip:           { backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  typeChipText:       { fontSize: 11, color: "#2563EB", fontWeight: "600" },
  dateText:           { fontSize: 11, color: "#94A3B8" },
  propName:           { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  infoRow:            { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 5 },
  infoText:           { fontSize: 12, color: "#475569", flex: 1 },
  ownerBox:           { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EFF6FF", borderRadius: 8, padding: 8, marginTop: 6, marginBottom: 8 },
  ownerText:          { fontSize: 12, color: "#1D4ED8", fontWeight: "500", flex: 1 },
  viewDetailsBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" },
  viewDetailsBtnText: { fontSize: 13, fontWeight: "700", color: "#1D4ED8" },
});

// ── Modal styles ──────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#F8FAFC" },
  header:           { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 10 },
  closeBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  headerTitle:      { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  headerSub:        { fontSize: 12, color: "#64748B", marginTop: 1 },
  statusChip:       { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusChipText:   { fontSize: 11, fontWeight: "800" },
  scrollContent:    { paddingBottom: 32 },
  image:            { width: "100%", height: 260 },
  imagePlaceholder: { backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", gap: 8 },
  noImageText:      { fontSize: 13, color: "#94A3B8", fontWeight: "500" },
  section:          { backgroundColor: "#fff", margin: 12, marginBottom: 0, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  sectionTitle:     { fontSize: 10, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1.4, marginBottom: 12 },
  rowWrap:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  typeBadge:        { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText:    { fontSize: 11, color: "#2563EB", fontWeight: "700" },
  listingId:        { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  propName:         { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 10, lineHeight: 28 },
  infoRow:          { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 5 },
  infoText:         { fontSize: 13, color: "#64748B", flex: 1, lineHeight: 18 },
  // Price strip
  priceStrip:       { flexDirection: "row", backgroundColor: "#F0FDF4", borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#BBF7D0" },
  priceBlock:       { flex: 1, alignItems: "center", gap: 3 },
  priceDivider:     { width: 1, backgroundColor: "#BBF7D0", marginHorizontal: 8 },
  priceLabel:       { fontSize: 11, color: "#64748B", fontWeight: "600" },
  priceValue:       { fontSize: 18, fontWeight: "800", color: "#059669" },
  // Table
  table:            { borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0" },
  tableRow:         { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#fff" },
  tableRowAlt:      { backgroundColor: "#F8FAFC" },
  tableLabelWrap:   { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  tableLabel:       { fontSize: 12, color: "#64748B", fontWeight: "600" },
  tableValue:       { flex: 1.2, fontSize: 12, fontWeight: "700", color: "#1E293B", textAlign: "right" },
  // Description
  descText:         { fontSize: 14, color: "#475569", lineHeight: 22 },
  // Owner
  ownerCard:        { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  ownerAvatar:      { width: 48, height: 48, borderRadius: 24, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center" },
  ownerAvatarText:  { fontSize: 20, fontWeight: "800", color: "#fff" },
  ownerName:        { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  ownerEmail:       { fontSize: 12, color: "#64748B" },
  ownerBadge:       { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EFF6FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ownerBadgeText:   { fontSize: 11, fontWeight: "600", color: "#1D4ED8" },
  // Status
  statusInfoBox:    { flexDirection: "row", alignItems: "flex-start", gap: 12, margin: 12, marginBottom: 0, borderRadius: 12, padding: 14, borderWidth: 1 },
  statusInfoLabel:  { fontSize: 12, fontWeight: "800", letterSpacing: 0.6, marginBottom: 2 },
  statusInfoText:   { fontSize: 13, lineHeight: 19, fontWeight: "500" },
  // Actions
  actionRow:        { flexDirection: "row", gap: 12, margin: 12, marginTop: 16, marginBottom: 0 },
  rejectBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA" },
  rejectBtnText:    { color: "#DC2626", fontSize: 14, fontWeight: "700" },
  approveBtn:       { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: "#059669" },
  approveBtnText:   { color: "#fff", fontSize: 14, fontWeight: "700" },
  decidedBox:       { margin: 12, marginTop: 16, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E2E8F0" },
  decidedBoxText:   { fontSize: 13, color: "#475569", lineHeight: 19, marginBottom: 12 },
});

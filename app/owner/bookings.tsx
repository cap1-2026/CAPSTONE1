// app/owner/bookings.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

const BASE = API_ENDPOINTS.APPROVE_BOOKING
  ? API_ENDPOINTS.APPROVE_BOOKING.replace("/approve_booking.php", "")
  : "http://192.168.0.131/Caps";

interface Booking {
  id: number;
  tenant_name: string;
  tenant_email: string;
  phone: string;
  property_name: string;
  property_address: string;
  property_price: number;
  move_in: string;
  lease_duration: string;
  occupants: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  special_request?: string;
}

export default function OwnerBookingsPage() {
  const router = useRouter();
  const [filter, setFilter]   = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [ownerId, setOwnerId]   = useState<number | null>(null);

  const fetchBookings = useCallback(async (id: number) => {
    try {
      const res  = await fetch(`${BASE}/get_bookings.php?owner_id=${id}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") setBookings(data.data ?? []);
      else Alert.alert("Error", data.message || "Could not load bookings.");
    } catch {
      Alert.alert("Error", "Cannot reach server. Make sure XAMPP is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    UserStorage.getUser().then((user) => {
      if (user) { setOwnerId(user.user_id); fetchBookings(user.user_id); }
      else setLoading(false);
    });
  }, [fetchBookings]);

  // ── Direct approve/reject — no Alert confirmation wrapper ─────────────────
  async function handleAction(bookingId: number, action: "approved" | "rejected") {
    setActionLoading(bookingId);
    try {
      const res  = await fetch(`${BASE}/approve_booking.php`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ booking_id: bookingId, action }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {
        Alert.alert("Server Error", `Unexpected response:\n${text.slice(0, 200)}`);
        return;
      }

      if (data.status === "success") {
        // Update UI immediately
        setBookings((prev) =>
          prev.map((b) => b.id === bookingId ? { ...b, status: action } : b)
        );
      } else {
        Alert.alert("Failed", data.message ?? "Please try again.");
      }
    } catch (e: any) {
      Alert.alert("Connection Error", e?.message ?? "Could not reach the server.");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = bookings.filter((b) =>
    filter === "all" ? true : b.status === filter
  );
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const statusColor = (s: string) =>
    s === "approved" ? "#4CAF50" : s === "pending" ? "#FF9800" : "#F44336";
  const statusIcon  = (s: string): any =>
    s === "approved" ? "checkmark-circle" : s === "pending" ? "time" : "close-circle";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Booking Requests</Text>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => { if (ownerId) { setLoading(true); fetchBookings(ownerId); } }}
        >
          <Ionicons name="refresh-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.emptyStateText, { marginTop: 16 }]}>Loading...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No booking requests found</Text>
          </View>
        ) : (
          filtered.map((booking) => (
            <View style={styles.card} key={booking.id}>
              {/* Status badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusColor(booking.status) }]}>
                <Ionicons name={statusIcon(booking.status)} size={14} color="#fff" />
                <Text style={styles.statusBadgeText}>{booking.status.toUpperCase()}</Text>
              </View>

              {/* Tenant */}
              <View style={styles.tenantSection}>
                <View style={styles.tenantAvatar}>
                  <Ionicons name="person" size={26} color="#007AFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tenantName}>{booking.tenant_name}</Text>
                  <Text style={styles.contactText}>{booking.tenant_email}</Text>
                  {booking.phone ? <Text style={styles.contactText}>{booking.phone}</Text> : null}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Property */}
              <Text style={styles.sectionLabel}>PROPERTY</Text>
              <Text style={styles.propertyName}>{booking.property_name}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={13} color="#666" />
                <Text style={styles.propertyAddress}>{booking.property_address}</Text>
              </View>

              <View style={styles.divider} />

              {/* Details */}
              <Text style={styles.sectionLabel}>BOOKING INFO</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={15} color="#666" />
                  <Text style={styles.detailLabel}>Move-in:</Text>
                  <Text style={styles.detailValue}>{booking.move_in}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={15} color="#666" />
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{booking.lease_duration}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={15} color="#666" />
                  <Text style={styles.detailLabel}>Monthly Rent:</Text>
                  <Text style={styles.detailValue}>₱{Number(booking.property_price).toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={15} color="#666" />
                  <Text style={styles.detailLabel}>Occupants:</Text>
                  <Text style={styles.detailValue}>{booking.occupants}</Text>
                </View>
              </View>

              {booking.special_request ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{booking.special_request}</Text>
                </View>
              ) : null}

              <Text style={styles.submittedDate}>
                Submitted {new Date(booking.created_at).toLocaleDateString()}
              </Text>

              {/* ── ACTION BUTTONS — only for pending ── */}
              {booking.status === "pending" && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.rejectButton, actionLoading === booking.id && { opacity: 0.5 }]}
                    onPress={() => handleAction(booking.id, "rejected")}
                    disabled={actionLoading === booking.id}
                  >
                    {actionLoading === booking.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="close-circle" size={18} color="#fff" /><Text style={styles.rejectButtonText}>Reject</Text></>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.approveButton, actionLoading === booking.id && { opacity: 0.5 }]}
                    onPress={() => handleAction(booking.id, "approved")}
                    disabled={actionLoading === booking.id}
                  >
                    {actionLoading === booking.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.approveButtonText}>Approve</Text></>}
                  </TouchableOpacity>
                </View>
              )}

              {booking.status === "approved" && (
                <View style={styles.approvedInfo}>
                  <Ionicons name="checkmark-circle" size={15} color="#4CAF50" />
                  <Text style={styles.approvedInfoText}>Approved — tenant can now proceed to payment.</Text>
                </View>
              )}

              {booking.status === "rejected" && (
                <View style={styles.rejectedInfo}>
                  <Ionicons name="close-circle" size={15} color="#F44336" />
                  <Text style={styles.rejectedInfoText}>Booking has been rejected.</Text>
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: "#f5f5f5" },
  header:               { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  backButton:           { marginRight: 12, padding: 4 },
  headerTextContainer:  { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:          { fontSize: 22, fontWeight: "bold", color: "#333" },
  pendingBadge:         { backgroundColor: "#FF9800", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  pendingBadgeText:     { color: "#fff", fontSize: 12, fontWeight: "600" },
  refreshButton:        { padding: 4 },
  filterTabs:           { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e0e0e0", gap: 6 },
  filterTab:            { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  filterTabActive:      { backgroundColor: "#007AFF" },
  filterTabText:        { fontSize: 12, fontWeight: "600", color: "#666" },
  filterTabTextActive:  { color: "#fff" },
  list:                 { flex: 1, padding: 14 },
  emptyState:           { alignItems: "center", paddingVertical: 80 },
  emptyStateText:       { fontSize: 16, color: "#999", marginTop: 12 },
  card:                 { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  statusBadge:          { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, gap: 5, marginBottom: 14 },
  statusBadgeText:      { fontSize: 11, fontWeight: "bold", color: "#fff" },
  tenantSection:        { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 12 },
  tenantAvatar:         { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center" },
  tenantName:           { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 2 },
  contactText:          { fontSize: 12, color: "#666", marginTop: 1 },
  divider:              { height: 1, backgroundColor: "#f0f0f0", marginVertical: 10 },
  sectionLabel:         { fontSize: 11, fontWeight: "700", color: "#007AFF", marginBottom: 8, letterSpacing: 0.5 },
  propertyName:         { fontSize: 15, fontWeight: "bold", color: "#333", marginBottom: 4 },
  addressRow:           { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  propertyAddress:      { fontSize: 12, color: "#666", flex: 1 },
  detailsGrid:          { gap: 8 },
  detailRow:            { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel:          { fontSize: 13, color: "#666", width: 100 },
  detailValue:          { fontSize: 13, fontWeight: "600", color: "#333", flex: 1 },
  notesBox:             { backgroundColor: "#f9f9f9", padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: "#007AFF", marginTop: 10 },
  notesText:            { fontSize: 13, color: "#666", lineHeight: 19 },
  submittedDate:        { fontSize: 11, color: "#999", marginTop: 10, marginBottom: 12 },
  actionButtons:        { flexDirection: "row", gap: 10 },
  approveButton:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#4CAF50", paddingVertical: 13, borderRadius: 10, gap: 6 },
  approveButtonText:    { color: "#fff", fontSize: 15, fontWeight: "700" },
  rejectButton:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F44336", paddingVertical: 13, borderRadius: 10, gap: 6 },
  rejectButtonText:     { color: "#fff", fontSize: 15, fontWeight: "700" },
  approvedInfo:         { flexDirection: "row", alignItems: "center", backgroundColor: "#E8F5E9", padding: 10, borderRadius: 8, gap: 8 },
  approvedInfoText:     { flex: 1, fontSize: 12, color: "#2E7D32" },
  rejectedInfo:         { flexDirection: "row", alignItems: "center", backgroundColor: "#FFEBEE", padding: 10, borderRadius: 8, gap: 8 },
  rejectedInfoText:     { flex: 1, fontSize: 12, color: "#C62828" },
});
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

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
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<number | null>(null);

  const fetchBookings = useCallback(async (id: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_BOOKINGS}?owner_id=${id}`);
      const data = await res.json();
      if (data.status === "success") setBookings(data.data);
    } catch {
      Alert.alert("Error", "Could not load bookings. Check your connection.");
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

  const filteredBookings = bookings.filter((b) =>
    filter === "all" ? true : b.status === filter
  );
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const getStatusColor = (s: string) => s === "approved" ? "#4CAF50" : s === "pending" ? "#FF9800" : "#F44336";
  const getStatusIcon = (s: string): any => s === "approved" ? "checkmark-circle" : s === "pending" ? "time" : "close-circle";

  const handleAction = (bookingId: number, action: "approved" | "rejected") => {
    const label = action === "approved" ? "Approve" : "Reject";
    Alert.alert(`${label} Booking`, `Are you sure you want to ${label.toLowerCase()} this booking?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: label,
        style: action === "rejected" ? "destructive" : "default",
        onPress: async () => {
          try {
            const res = await fetch(API_ENDPOINTS.APPROVE_BOOKING, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ booking_id: bookingId, action }),
            });
            const data = await res.json();
            if (data.status === "success") {
              setBookings((prev) =>
                prev.map((b) => b.id === bookingId ? { ...b, status: action } : b)
              );
              Alert.alert("Done", `Booking ${action} successfully.`);
            } else {
              Alert.alert("Failed", data.message ?? "Please try again.");
            }
          } catch {
            Alert.alert("Connection Error", "Could not reach the server.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
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

      <ScrollView style={styles.requestsList}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.emptyStateText, { marginTop: 16 }]}>Loading...</Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No booking requests found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === "pending" ? "No pending requests at the moment" : `No ${filter} booking requests`}
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <View style={styles.requestCard} key={booking.id}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                <Ionicons name={getStatusIcon(booking.status)} size={16} color="#fff" />
                <Text style={styles.statusBadgeText}>{booking.status.toUpperCase()}</Text>
              </View>

              <View style={styles.tenantSection}>
                <View style={styles.tenantAvatar}>
                  <Ionicons name="person" size={28} color="#007AFF" />
                </View>
                <View style={styles.tenantInfo}>
                  <Text style={styles.tenantName}>{booking.tenant_name}</Text>
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={12} color="#666" />
                    <Text style={styles.contactText}>{booking.tenant_email}</Text>
                  </View>
                  {booking.phone ? (
                    <View style={styles.contactRow}>
                      <Ionicons name="call-outline" size={12} color="#666" />
                      <Text style={styles.contactText}>{booking.phone}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Property Details</Text>
              <Text style={styles.propertyName}>{booking.property_name}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.propertyAddress}>{booking.property_address}</Text>
              </View>

              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Booking Information</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Move-in Date:</Text>
                  <Text style={styles.detailValue}>{booking.move_in}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{booking.lease_duration}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Monthly Rent:</Text>
                  <Text style={styles.detailValue}>₱{Number(booking.property_price).toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Occupants:</Text>
                  <Text style={styles.detailValue}>{booking.occupants} {booking.occupants === 1 ? "person" : "people"}</Text>
                </View>
              </View>

              {booking.special_request ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionLabel}>Notes</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{booking.special_request}</Text>
                  </View>
                </>
              ) : null}

              <Text style={styles.submittedDate}>
                Submitted on {new Date(booking.created_at).toLocaleDateString()}
              </Text>

              {booking.status === "pending" && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.approveButton} onPress={() => handleAction(booking.id, "approved")}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectButton} onPress={() => handleAction(booking.id, "rejected")}>
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {booking.status === "approved" && (
                <View style={styles.approvedInfo}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.approvedInfoText}>Approved — tenant can now proceed to payment.</Text>
                </View>
              )}

              {booking.status === "rejected" && (
                <View style={styles.rejectedInfo}>
                  <Ionicons name="close-circle" size={16} color="#F44336" />
                  <Text style={styles.rejectedInfoText}>Booking rejected.</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  backButton: { marginRight: 12, padding: 4 },
  headerTextContainer: { flex: 1, flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333", marginRight: 8 },
  pendingBadge: { backgroundColor: "#FF9800", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pendingBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  refreshButton: { padding: 4 },
  filterTabs: { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8, marginHorizontal: 4 },
  filterTabActive: { backgroundColor: "#007AFF" },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#666" },
  filterTabTextActive: { color: "#fff" },
  requestsList: { flex: 1, padding: 16 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyStateText: { fontSize: 18, fontWeight: "600", color: "#999", marginTop: 16 },
  emptyStateSubtext: { fontSize: 14, color: "#bbb", marginTop: 8 },
  requestCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statusBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6, marginBottom: 16 },
  statusBadgeText: { fontSize: 11, fontWeight: "bold", color: "#fff" },
  tenantSection: { flexDirection: "row", marginBottom: 16 },
  tenantAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center", marginRight: 12 },
  tenantInfo: { flex: 1, justifyContent: "center" },
  tenantName: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 4 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  contactText: { fontSize: 12, color: "#666" },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 12 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#007AFF", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  propertyName: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 4 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  propertyAddress: { fontSize: 13, color: "#666" },
  detailsGrid: { gap: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel: { fontSize: 13, color: "#666", width: 110 },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#333", flex: 1 },
  notesBox: { backgroundColor: "#f9f9f9", padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: "#007AFF" },
  notesText: { fontSize: 13, color: "#666", lineHeight: 20 },
  submittedDate: { fontSize: 12, color: "#999", marginTop: 12, marginBottom: 12 },
  actionButtons: { flexDirection: "row", gap: 12, marginBottom: 12 },
  approveButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#4CAF50", paddingVertical: 12, borderRadius: 8, gap: 8 },
  approveButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  rejectButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F44336", paddingVertical: 12, borderRadius: 8, gap: 8 },
  rejectButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  approvedInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#E8F5E9", padding: 12, borderRadius: 8, gap: 8, marginTop: 4 },
  approvedInfoText: { flex: 1, fontSize: 12, color: "#2E7D32", lineHeight: 18 },
  rejectedInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFEBEE", padding: 12, borderRadius: 8, gap: 8, marginTop: 4 },
  rejectedInfoText: { flex: 1, fontSize: 12, color: "#C62828", lineHeight: 18 },
});

interface BookingRequest {
  id: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyName: string;
  propertyAddress: string;
  moveInDate: string;
  leaseDuration: string;
  monthlyRent: number;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  numberOfOccupants: number;
  employmentStatus: string;
  monthlyIncome: number;
  additionalNotes?: string;
}

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

interface Booking {
  id: number;
  property_name: string;
  property_address: string;
  property_price: number;
  move_in: string;
  lease_duration: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const fetchBookings = useCallback(async (tenantId: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_BOOKINGS}?tenant_id=${tenantId}`);
      const data = await res.json();
      if (data.status === "success") {
        setBookings(data.data);
      }
    } catch {
      Alert.alert("Error", "Could not load booking requests. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    UserStorage.getUser().then((user) => {
      if (user) {
        setUserId(user.user_id);
        fetchBookings(user.user_id);
      } else {
        setLoading(false);
      }
    });
  }, [fetchBookings]);

  const filteredBookings = bookings.filter((b) =>
    filter === "all" ? true : b.status === filter
  );

  const getStatusColor = (status: string) => {
    if (status === "approved") return "#4CAF50";
    if (status === "pending") return "#FF9800";
    return "#F44336";
  };

  const getStatusIcon = (status: string): any => {
    if (status === "approved") return "checkmark-circle";
    if (status === "pending") return "time";
    return "close-circle";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Booking Requests</Text>
          <Text style={styles.headerSubtitle}>Track your booking applications</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => { if (userId) { setLoading(true); fetchBookings(userId); } }}
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
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No booking requests found</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push("/tenant/browse-properties")}
            >
              <Text style={styles.browseButtonText}>Browse Properties</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <View style={styles.requestCard} key={booking.id}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                <Ionicons name={getStatusIcon(booking.status)} size={16} color="#fff" />
                <Text style={styles.statusBadgeText}>{booking.status.toUpperCase()}</Text>
              </View>

              <Text style={styles.propertyName}>{booking.property_name}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.propertyAddress}>{booking.property_address}</Text>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Move-in:</Text>
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
                  <Text style={styles.detailValue}>
                    ₱{Number(booking.property_price).toLocaleString()}
                  </Text>
                </View>
              </View>

              <Text style={styles.submittedDate}>
                Submitted on {new Date(booking.created_at).toLocaleDateString()}
              </Text>

              {booking.status === "approved" && (
                <TouchableOpacity
                  style={styles.paymentButton}
                  onPress={() =>
                    router.push({
                      pathname: "/tenant/payment",
                      params: {
                        booking_id: String(booking.id),
                        amount: String(Number(booking.property_price) * 2),
                        property_name: booking.property_name,
                        property_address: booking.property_address,
                        monthly_rent: String(booking.property_price),
                      },
                    })
                  }
                >
                  <Ionicons name="card-outline" size={20} color="#fff" />
                  <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
                </TouchableOpacity>
              )}

              {booking.status === "rejected" && (
                <TouchableOpacity
                  style={styles.browseAgainButton}
                  onPress={() => router.push("/tenant/browse-properties")}
                >
                  <Ionicons name="search-outline" size={20} color="#007AFF" />
                  <Text style={styles.browseAgainButtonText}>Browse Other Properties</Text>
                </TouchableOpacity>
              )}

              {booking.status === "pending" && (
                <View style={styles.pendingInfo}>
                  <Ionicons name="information-circle-outline" size={16} color="#FF9800" />
                  <Text style={styles.pendingInfoText}>
                    Waiting for owner's approval (usually within 2-3 business days)
                  </Text>
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
  header: {
    backgroundColor: "#fff", flexDirection: "row", alignItems: "center",
    padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: "#e0e0e0",
  },
  backButton: { marginRight: 12, padding: 4 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: "#666" },
  refreshButton: { padding: 4 },
  filterTabs: {
    flexDirection: "row", backgroundColor: "#fff",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#e0e0e0",
  },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8, marginHorizontal: 4 },
  filterTabActive: { backgroundColor: "#007AFF" },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#666" },
  filterTabTextActive: { color: "#fff" },
  requestsList: { flex: 1, padding: 16 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyStateText: { fontSize: 16, color: "#999", marginTop: 16, marginBottom: 24 },
  browseButton: { backgroundColor: "#007AFF", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  browseButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  requestCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  statusBadge: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, gap: 4, marginBottom: 6,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "bold", color: "#fff" },
  propertyName: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 6 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  propertyAddress: { fontSize: 13, color: "#666" },
  detailsGrid: { gap: 6, marginBottom: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailLabel: { fontSize: 13, color: "#666", width: 90 },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#333", flex: 1 },
  submittedDate: { fontSize: 12, color: "#999", marginTop: 2, marginBottom: 8 },
  paymentButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#4CAF50", paddingVertical: 10, borderRadius: 8, gap: 6,
  },
  paymentButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  browseAgainButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: "#007AFF", gap: 6,
  },
  browseAgainButtonText: { color: "#007AFF", fontSize: 14, fontWeight: "600" },
  pendingInfo: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFF3E0", padding: 8, borderRadius: 8, gap: 6,
  },
  pendingInfoText: { flex: 1, fontSize: 11, color: "#E65100", lineHeight: 16 },
});

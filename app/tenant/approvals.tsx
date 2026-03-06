import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BookingRequest {
  id: string;
  propertyName: string;
  propertyAddress: string;
  moveInDate: string;
  leaseDuration: string;
  monthlyRent: number;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Mock booking requests data
  const [bookingRequests] = useState<BookingRequest[]>([
    {
      id: "1",
      propertyName: "Sunshine Apartments Unit 3A",
      propertyAddress: "123 Main St, Makati City",
      moveInDate: "04/01/2026",
      leaseDuration: "12 months",
      monthlyRent: 15000,
      status: "approved",
      submittedDate: "03/05/2026"
    },
    {
      id: "2",
      propertyName: "Modern Studio Downtown",
      propertyAddress: "456 BGC, Taguig City",
      moveInDate: "03/15/2026",
      leaseDuration: "6 months",
      monthlyRent: 18000,
      status: "pending",
      submittedDate: "03/04/2026"
    },
    {
      id: "3",
      propertyName: "Cozy 2BR Condo",
      propertyAddress: "789 Ortigas, Pasig City",
      moveInDate: "03/20/2026",
      leaseDuration: "24 months",
      monthlyRent: 25000,
      status: "rejected",
      submittedDate: "03/02/2026"
    }
  ]);

  const filteredRequests = bookingRequests.filter(request => {
    return filter === "all" || request.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "#4CAF50";
      case "pending": return "#FF9800";
      case "rejected": return "#F44336";
      default: return "#999";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return "checkmark-circle";
      case "pending": return "time";
      case "rejected": return "close-circle";
      default: return "help-circle";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Booking Requests</Text>
          <Text style={styles.headerSubtitle}>Track your booking applications</Text>
        </View>
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
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Booking Requests List */}
      <ScrollView style={styles.requestsList}>
        {filteredRequests.length === 0 ? (
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
          filteredRequests.map((request) => (
            // @ts-ignore - React key prop is valid but not in ViewProps type definition
            <View style={styles.requestCard} key={request.id}>
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                <Ionicons name={getStatusIcon(request.status) as any} size={16} color="#fff" />
                <Text style={styles.statusBadgeText}>{request.status.toUpperCase()}</Text>
              </View>

              {/* Property Info */}
              <Text style={styles.propertyName}>{request.propertyName}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.propertyAddress}>{request.propertyAddress}</Text>
              </View>

              {/* Booking Details */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Move-in:</Text>
                  <Text style={styles.detailValue}>{request.moveInDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{request.leaseDuration}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Monthly Rent:</Text>
                  <Text style={styles.detailValue}>₱{request.monthlyRent.toLocaleString()}</Text>
                </View>
              </View>

              <Text style={styles.submittedDate}>Submitted on {request.submittedDate}</Text>

              {/* Action Buttons */}
              {request.status === "approved" && (
                <TouchableOpacity 
                  style={styles.paymentButton}
                  onPress={() => router.push("/tenant/payment")}
                >
                  <Ionicons name="card-outline" size={20} color="#fff" />
                  <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
                </TouchableOpacity>
              )}

              {request.status === "rejected" && (
                <TouchableOpacity 
                  style={styles.browseAgainButton}
                  onPress={() => router.push("/tenant/browse-properties")}
                >
                  <Ionicons name="search-outline" size={20} color="#007AFF" />
                  <Text style={styles.browseAgainButtonText}>Browse Other Properties</Text>
                </TouchableOpacity>
              )}

              {request.status === "pending" && (
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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: "#007AFF",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  filterTabTextActive: {
    color: "#fff",
  },
  requestsList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
    marginBottom: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  propertyAddress: {
    fontSize: 13,
    color: "#666",
  },
  detailsGrid: {
    gap: 6,
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    width: 90,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  submittedDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    marginBottom: 8,
  },
  paymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  paymentButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  browseAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    gap: 6,
  },
  browseAgainButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  pendingInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  pendingInfoText: {
    flex: 1,
    fontSize: 11,
    color: "#E65100",
    lineHeight: 16,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BookingRequest {
  id: string;
  propertyName: string;
  propertyAddress: string;
  ownerName: string;
  moveInDate: string;
  leaseDuration: string;
  monthlyRent: number;
  securityDeposit: number;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  statusMessage?: string;
  propertyImage: string;
}

export default function TenantApprovalsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Mock booking requests data for the current tenant
  const bookingRequests: BookingRequest[] = [
    {
      id: "1",
      propertyName: "Sunshine Apartments Unit 3A",
      propertyAddress: "123 Main St, Makati City",
      ownerName: "John Smith",
      moveInDate: "04/01/2026",
      leaseDuration: "12 months",
      monthlyRent: 15000,
      securityDeposit: 15000,
      requestDate: "03/05/2026",
      status: "pending",
      statusMessage: "Your booking request is being reviewed by the property owner.",
      propertyImage: "https://via.placeholder.com/100x100/4CAF50/FFFFFF?text=Property"
    },
    {
      id: "2",
      propertyName: "Modern Studio Downtown",
      propertyAddress: "456 BGC, Taguig City",
      ownerName: "Maria Garcia",
      moveInDate: "03/15/2026",
      leaseDuration: "6 months",
      monthlyRent: 18000,
      securityDeposit: 18000,
      requestDate: "03/02/2026",
      status: "approved",
      statusMessage: "Congratulations! Your booking has been approved. Please proceed with payment.",
      propertyImage: "https://via.placeholder.com/100x100/2196F3/FFFFFF?text=Property"
    },
    {
      id: "3",
      propertyName: "Cozy 2BR Condo",
      propertyAddress: "789 Ortigas, Pasig City",
      ownerName: "Pedro Reyes",
      moveInDate: "03/20/2026",
      leaseDuration: "24 months",
      monthlyRent: 25000,
      securityDeposit: 25000,
      requestDate: "02/28/2026",
      status: "rejected",
      statusMessage: "Unfortunately, the property owner has declined your booking request.",
      propertyImage: "https://via.placeholder.com/100x100/FF9800/FFFFFF?text=Property"
    }
  ];

  const filteredRequests = bookingRequests.filter(req => {
    return filter === "all" || req.status === filter;
  });

  const pendingCount = bookingRequests.filter(r => r.status === "pending").length;
  const approvedCount = bookingRequests.filter(r => r.status === "approved").length;

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
          <Text style={styles.headerSubtitle}>Track the status of your applications</Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <View style={[styles.statIconCircle, { backgroundColor: "#FFF3E0" }]}>
            <Ionicons name="time-outline" size={24} color="#FF9800" />
          </View>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconCircle, { backgroundColor: "#E8F5E9" }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.statNumber}>{approvedCount}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconCircle, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="document-text-outline" size={24} color="#2196F3" />
          </View>
          <Text style={styles.statNumber}>{bookingRequests.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f === "all" ? "All Requests" : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Booking Requests</Text>
            <Text style={styles.emptyStateText}>
              You haven't submitted any booking requests yet.
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push("/tenant/browse-properties")}
            >
              <Text style={styles.browseButtonText}>Browse Properties</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          filteredRequests.map((request) => (
            // @ts-ignore - React key prop is valid but not in ViewProps type definition
            <View style={styles.requestCard} key={request.id}>
              {/* Status Badge */}
              <View style={[
                styles.statusBadge,
                request.status === "pending" && styles.statusPending,
                request.status === "approved" && styles.statusApproved,
                request.status === "rejected" && styles.statusRejected
              ]}>
                <Ionicons 
                  name={
                    request.status === "pending" ? "time-outline" :
                    request.status === "approved" ? "checkmark-circle-outline" :
                    "close-circle-outline"
                  } 
                  size={16} 
                  color="#fff" 
                />
                <Text style={styles.statusBadgeText}>
                  {request.status.toUpperCase()}
                </Text>
              </View>

              <View style={styles.requestContent}>
                {/* Property Info */}
                <View style={styles.propertyInfo}>
                  <Image
                    source={{ uri: request.propertyImage }}
                    style={styles.propertyImage}
                  />
                  <View style={styles.propertyDetails}>
                    <Text style={styles.propertyName}>{request.propertyName}</Text>
                    <Text style={styles.propertyAddress}>
                      <Ionicons name="location-outline" size={14} color="#666" /> {request.propertyAddress}
                    </Text>
                    <Text style={styles.ownerName}>
                      <Ionicons name="person-outline" size={14} color="#666" /> Owner: {request.ownerName}
                    </Text>
                  </View>
                </View>

                {/* Status Message */}
                {request.statusMessage && (
                  <View style={[
                    styles.statusMessageBox,
                    request.status === "pending" && styles.statusMessagePending,
                    request.status === "approved" && styles.statusMessageApproved,
                    request.status === "rejected" && styles.statusMessageRejected
                  ]}>
                    <Text style={styles.statusMessageText}>{request.statusMessage}</Text>
                  </View>
                )}

                {/* Booking Details */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={18} color="#666" />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Move-in Date</Text>
                      <Text style={styles.detailValue}>{request.moveInDate}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={18} color="#666" />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Duration</Text>
                      <Text style={styles.detailValue}>{request.leaseDuration}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={18} color="#666" />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Monthly Rent</Text>
                      <Text style={[styles.detailValue, styles.priceValue]}>
                        ₱{request.monthlyRent.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#666" />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Security Deposit</Text>
                      <Text style={[styles.detailValue, styles.priceValue]}>
                        ₱{request.securityDeposit.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Request Date */}
                <Text style={styles.requestDate}>
                  <Ionicons name="calendar" size={12} color="#999" /> Submitted on {request.requestDate}
                </Text>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {request.status === "approved" && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.proceedButton]}
                      onPress={() => router.push("/tenant/payment")}
                    >
                      <Ionicons name="card-outline" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Proceed to Payment</Text>
                    </TouchableOpacity>
                  )}
                  {request.status === "pending" && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => console.log("Cancel request")}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#F44336" />
                      <Text style={[styles.actionButtonText, { color: "#F44336" }]}>Cancel Request</Text>
                    </TouchableOpacity>
                  )}
                  {request.status === "rejected" && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.browseAgainButton]}
                      onPress={() => router.push("/tenant/browse-properties")}
                    >
                      <Ionicons name="search-outline" size={20} color="#007AFF" />
                      <Text style={[styles.actionButtonText, { color: "#007AFF" }]}>Browse Other Properties</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.detailsButton]}
                    onPress={() => router.push(`/tenant/property/${request.id}`)}
                  >
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={[styles.actionButtonText, { color: "#666" }]}>View Property</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: "#f8f9fa",
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
  statsBar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  filterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#007AFF",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  filterChipTextActive: {
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
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  statusPending: {
    backgroundColor: "#FF9800",
  },
  statusApproved: {
    backgroundColor: "#4CAF50",
  },
  statusRejected: {
    backgroundColor: "#F44336",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  requestContent: {
    padding: 16,
  },
  propertyInfo: {
    flexDirection: "row",
    marginBottom: 16,
  },
  propertyImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
  },
  propertyDetails: {
    flex: 1,
    justifyContent: "center",
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  propertyAddress: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 13,
    color: "#666",
  },
  statusMessageBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusMessagePending: {
    backgroundColor: "#FFF3E0",
  },
  statusMessageApproved: {
    backgroundColor: "#E8F5E9",
  },
  statusMessageRejected: {
    backgroundColor: "#FFEBEE",
  },
  statusMessageText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    gap: 8,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  priceValue: {
    color: "#4CAF50",
  },
  requestDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: "48%",
  },
  proceedButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F44336",
  },
  browseAgainButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  detailsButton: {
    backgroundColor: "#f5f5f5",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
});

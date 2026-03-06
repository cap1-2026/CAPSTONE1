import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface BookingRequest {
  id: string;
  propertyName: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantCurrentAddress: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  moveInDate: string;
  leaseDuration: string;
  monthlyRent: number;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  propertyImage: string;
  tenantMessage?: string;
}

export default function OwnerBookingsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock booking requests data
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([
    {
      id: "1",
      propertyName: "Sunshine Apartments Unit 3A",
      propertyAddress: "123 Main St, Makati City",
      tenantName: "Juan Dela Cruz",
      tenantEmail: "juan.delacruz@email.com",
      tenantPhone: "+63 912 345 6789",
      tenantCurrentAddress: "456 Rizal Ave, Unit 12B, Manila City",
      emergencyContactName: "Maria Dela Cruz",
      emergencyContactNumber: "+63 912 345 6788",
      moveInDate: "04/01/2026",
      leaseDuration: "12 months",
      monthlyRent: 15000,
      requestDate: "03/05/2026",
      status: "pending",
      propertyImage: "https://via.placeholder.com/100x100/4CAF50/FFFFFF?text=Property",
      tenantMessage: "I'm a working professional looking for a long-term rental. I can provide employment certificate and references."
    },
    {
      id: "2",
      propertyName: "Modern Studio Downtown",
      propertyAddress: "456 BGC, Taguig City",
      tenantName: "Maria Santos",
      tenantEmail: "maria.santos@email.com",
      tenantPhone: "+63 917 123 4567",
      tenantCurrentAddress: "789 Quezon Ave, Unit 5C, Quezon City",
      emergencyContactName: "Pedro Santos",
      emergencyContactNumber: "+63 917 123 4566",
      moveInDate: "03/15/2026",
      leaseDuration: "6 months",
      monthlyRent: 18000,
      requestDate: "03/04/2026",
      status: "pending",
      propertyImage: "https://via.placeholder.com/100x100/2196F3/FFFFFF?text=Property",
      tenantMessage: "I'm relocating for work. Need a place close to my office."
    },
    {
      id: "3",
      propertyName: "Sunshine Apartments Unit 3A",
      propertyAddress: "123 Main St, Makati City",
      tenantName: "Ana Garcia",
      tenantEmail: "ana.garcia@email.com",
      tenantPhone: "+63 918 765 4321",
      tenantCurrentAddress: "321 EDSA, Unit 8D, Mandaluyong City",
      emergencyContactName: "Carlos Garcia",
      emergencyContactNumber: "+63 918 765 4320",
      moveInDate: "04/01/2026",
      leaseDuration: "12 months",
      monthlyRent: 15000,
      requestDate: "03/05/2026",
      status: "pending",
      propertyImage: "https://via.placeholder.com/100x100/4CAF50/FFFFFF?text=Property",
      tenantMessage: "I'm interested in this property. I have stable employment and excellent rental history."
    },
    {
      id: "4",
      propertyName: "Cozy 2BR Condo",
      propertyAddress: "789 Ortigas, Pasig City",
      tenantName: "Pedro Reyes",
      tenantEmail: "pedro.reyes@email.com",
      tenantPhone: "+63 920 987 6543",
      tenantCurrentAddress: "555 Shaw Blvd, Unit 3F, Pasig City",
      emergencyContactName: "Rosa Reyes",
      emergencyContactNumber: "+63 920 987 6542",
      moveInDate: "03/20/2026",
      leaseDuration: "24 months",
      monthlyRent: 25000,
      requestDate: "03/02/2026",
      status: "approved",
      propertyImage: "https://via.placeholder.com/100x100/FF9800/FFFFFF?text=Property"
    }
  ]);

  const handleApprove = (id: string) => {
    Alert.alert(
      "Approve Booking Request",
      "Are you sure you want to approve this booking? The tenant will be notified and can proceed to payment. All other pending requests for this property will be automatically rejected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: () => {
            // Find the approved request to get property details
            const approvedRequest = bookingRequests.find(req => req.id === id);
            if (!approvedRequest) return;

            setBookingRequests(prev =>
              prev.map(req => {
                // Approve the selected request
                if (req.id === id) {
                  return { ...req, status: "approved" as const };
                }
                // Auto-reject all other pending requests for the same property
                if (req.propertyName === approvedRequest.propertyName && req.status === "pending") {
                  return { ...req, status: "rejected" as const };
                }
                return req;
              })
            );
            
            // Count how many other pending requests were rejected
            const rejectedCount = bookingRequests.filter(
              req => req.propertyName === approvedRequest.propertyName && 
                     req.status === "pending" && 
                     req.id !== id
            ).length;

            const message = rejectedCount > 0
              ? `Booking approved! The tenant has been notified and can now proceed with payment. ${rejectedCount} other pending request(s) for this property have been automatically rejected.`
              : "Booking approved! The tenant has been notified and can now proceed with payment.";
            
            Alert.alert("Success", message);
          }
        }
      ]
    );
  };

  const handleReject = (id: string) => {
    Alert.alert(
      "Reject Booking Request",
      "Are you sure you want to reject this booking? The tenant will be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            setBookingRequests(prev =>
              prev.map(req => req.id === id ? { ...req, status: "rejected" as const } : req)
            );
            Alert.alert("Booking Rejected", "The tenant has been notified of your decision.");
          }
        }
      ]
    );
  };

  const filteredRequests = bookingRequests.filter(req => {
    const matchesFilter = filter === "all" || req.status === filter;
    const matchesSearch = req.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = bookingRequests.filter(r => r.status === "pending").length;

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
          <Text style={styles.headerTitle}>Booking Requests</Text>
          <Text style={styles.headerSubtitle}>Review and manage tenant applications</Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{bookingRequests.filter(r => r.status === "approved").length}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{bookingRequests.filter(r => r.status === "rejected").length}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by property or tenant name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
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

      {/* Requests List */}
      <ScrollView style={styles.requestsList}>
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No booking requests found</Text>
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
                    <Text style={styles.propertyAddress}>{request.propertyAddress}</Text>
                  </View>
                </View>

                {/* Tenant Info */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Tenant Information</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <Text style={styles.infoLabel}>Full Name:</Text>
                    <Text style={styles.infoValue}>{request.tenantName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={16} color="#666" />
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{request.tenantEmail}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={16} color="#666" />
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{request.tenantPhone}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="home-outline" size={16} color="#666" />
                    <Text style={styles.infoLabel}>Current Address:</Text>
                    <Text style={styles.infoValue}>{request.tenantCurrentAddress}</Text>
                  </View>
                </View>

                {/* Emergency Contact */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Emergency Contact</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-circle-outline" size={16} color="#666" />
                    <Text style={styles.infoLabel}>Contact Name:</Text>
                    <Text style={styles.infoValue}>{request.emergencyContactName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={16} color="#666" />
                    <Text style={styles.infoLabel}>Contact Number:</Text>
                    <Text style={styles.infoValue}>{request.emergencyContactNumber}</Text>
                  </View>
                </View>

                {/* Tenant Message */}
                {request.tenantMessage && (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageTitle}>Message from Tenant:</Text>
                    <Text style={styles.messageText}>{request.tenantMessage}</Text>
                  </View>
                )}

                {/* Booking Details */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Booking Details</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.infoLabel}>Move-in:</Text>
                    <Text style={styles.infoValue}>{request.moveInDate}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.infoLabel}>Duration:</Text>
                    <Text style={styles.infoValue}>{request.leaseDuration}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={16} color="#666" />
                    <Text style={styles.infoLabel}>Monthly Rent:</Text>
                    <Text style={[styles.infoValue, styles.rentValue]}>
                      ₱{request.monthlyRent.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Request Date */}
                <Text style={styles.requestDate}>
                  Requested on {request.requestDate}
                </Text>

                {/* Action Buttons */}
                {request.status === "pending" && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleReject(request.id)}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(request.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {request.status !== "pending" && (
                  <View style={styles.statusMessage}>
                    <Ionicons 
                      name={request.status === "approved" ? "checkmark-circle" : "close-circle"} 
                      size={20} 
                      color={request.status === "approved" ? "#4CAF50" : "#F44336"} 
                    />
                    <Text style={styles.statusMessageText}>
                      {request.status === "approved" 
                        ? "Approved - Tenant can now proceed to payment" 
                        : "Rejected - Tenant has been notified"}
                    </Text>
                  </View>
                )}
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
  statsBar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
  },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
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
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
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
    width: 80,
    height: 80,
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
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 13,
    color: "#666",
  },
  infoSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
    marginRight: 8,
    width: 120,
  },
  infoValue: {
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
  rentValue: {
    fontWeight: "bold",
    color: "#4CAF50",
  },
  messageBox: {
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  messageTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  requestDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusMessageText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
});

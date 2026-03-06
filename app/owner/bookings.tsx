import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

export default function OwnerBookingsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([
    {
      id: "1",
      tenantName: "John Doe",
      tenantEmail: "john.doe@email.com",
      tenantPhone: "+63 912 345 6789",
      propertyName: "Sunshine Apartments Unit 3A",
      propertyAddress: "123 Main St, Makati City",
      moveInDate: "04/01/2026",
      leaseDuration: "12 months",
      monthlyRent: 15000,
      status: "pending",
      submittedDate: "03/05/2026",
      numberOfOccupants: 2,
      employmentStatus: "Full-time Employee",
      monthlyIncome: 45000,
      additionalNotes: "Looking for a long-term lease. Non-smoker, no pets."
    },
    {
      id: "2",
      tenantName: "Maria Santos",
      tenantEmail: "maria.santos@email.com",
      tenantPhone: "+63 917 234 5678",
      propertyName: "Modern Studio Downtown",
      propertyAddress: "456 BGC, Taguig City",
      moveInDate: "03/15/2026",
      leaseDuration: "6 months",
      monthlyRent: 18000,
      status: "pending",
      submittedDate: "03/04/2026",
      numberOfOccupants: 1,
      employmentStatus: "Freelancer",
      monthlyIncome: 50000,
      additionalNotes: "Working remotely, need stable internet connection."
    },
    {
      id: "3",
      tenantName: "Carlos Reyes",
      tenantEmail: "carlos.reyes@email.com",
      tenantPhone: "+63 918 345 6789",
      propertyName: "Cozy 2BR Condo",
      propertyAddress: "789 Ortigas, Pasig City",
      moveInDate: "03/20/2026",
      leaseDuration: "24 months",
      monthlyRent: 25000,
      status: "approved",
      submittedDate: "03/02/2026",
      numberOfOccupants: 3,
      employmentStatus: "Full-time Employee",
      monthlyIncome: 80000,
      additionalNotes: "Family of 3, clean and responsible tenants."
    },
    {
      id: "4",
      tenantName: "Sarah Lee",
      tenantEmail: "sarah.lee@email.com",
      tenantPhone: "+63 919 456 7890",
      propertyName: "Luxe Studio in BGC",
      propertyAddress: "101 BGC Ave, Taguig City",
      moveInDate: "03/25/2026",
      leaseDuration: "12 months",
      monthlyRent: 20000,
      status: "rejected",
      submittedDate: "03/01/2026",
      numberOfOccupants: 1,
      employmentStatus: "Student",
      monthlyIncome: 15000,
      additionalNotes: "College student with parental support."
    }
  ]);

  const filteredRequests = bookingRequests.filter(request => {
    return filter === "all" || request.status === filter;
  });

  const pendingCount = bookingRequests.filter(r => r.status === "pending").length;

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

  const handleApprove = (bookingId: string) => {
    Alert.alert(
      "Approve Booking",
      "Are you sure you want to approve this booking request? The tenant will be notified and can proceed to payment.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: () => {
            setBookingRequests(prev =>
              prev.map(booking =>
                booking.id === bookingId ? { ...booking, status: "approved" as const } : booking
              )
            );
            Alert.alert("Success", "Booking request approved! Tenant has been notified.");
          }
        }
      ]
    );
  };

  const handleReject = (bookingId: string) => {
    Alert.alert(
      "Reject Booking",
      "Are you sure you want to reject this booking request? The tenant will be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            setBookingRequests(prev =>
              prev.map(booking =>
                booking.id === bookingId ? { ...booking, status: "rejected" as const } : booking
              )
            );
            Alert.alert("Rejected", "Booking request has been rejected. Tenant has been notified.");
          }
        }
      ]
    );
  };

  const handleContactTenant = (tenantPhone: string, tenantEmail: string, tenantName: string) => {
    Alert.alert(
      `Contact ${tenantName}`,
      `Choose contact method:`,
      [
        { text: "Call", onPress: () => Alert.alert("Phone", `Calling ${tenantPhone}`) },
        { text: "Email", onPress: () => Alert.alert("Email", `Email: ${tenantEmail}`) },
        { text: "Message", onPress: () => Alert.alert("Messages", "Messaging feature coming soon!") },
        { text: "Cancel", style: "cancel" }
      ]
    );
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
          <Text style={styles.headerTitle}>Booking Requests</Text>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => Alert.alert("Refresh", "Booking requests updated!")}
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
              {f === "pending" && pendingCount > 0 && ` (${pendingCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Booking Requests List */}
      <ScrollView style={styles.requestsList}>
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No booking requests found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === "pending" 
                ? "No pending requests at the moment" 
                : `No ${filter} booking requests`}
            </Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            // @ts-ignore - React key prop is valid
            <View style={styles.requestCard} key={request.id}>
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                <Ionicons name={getStatusIcon(request.status) as any} size={16} color="#fff" />
                <Text style={styles.statusBadgeText}>{request.status.toUpperCase()}</Text>
              </View>

              {/* Tenant Info */}
              <View style={styles.tenantSection}>
                <View style={styles.tenantAvatar}>
                  <Ionicons name="person" size={28} color="#007AFF" />
                </View>
                <View style={styles.tenantInfo}>
                  <Text style={styles.tenantName}>{request.tenantName}</Text>
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={12} color="#666" />
                    <Text style={styles.contactText}>{request.tenantEmail}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={12} color="#666" />
                    <Text style={styles.contactText}>{request.tenantPhone}</Text>
                  </View>
                </View>
              </View>

              {/* Property Info */}
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Property Details</Text>
              <Text style={styles.propertyName}>{request.propertyName}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.propertyAddress}>{request.propertyAddress}</Text>
              </View>

              {/* Booking Details */}
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Booking Information</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Move-in Date:</Text>
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
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Occupants:</Text>
                  <Text style={styles.detailValue}>{request.numberOfOccupants} {request.numberOfOccupants === 1 ? "person" : "people"}</Text>
                </View>
              </View>

              {/* Tenant Background */}
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Tenant Background</Text>
              <View style={styles.backgroundInfo}>
                <View style={styles.backgroundRow}>
                  <Ionicons name="briefcase-outline" size={16} color="#666" />
                  <Text style={styles.backgroundLabel}>Employment:</Text>
                  <Text style={styles.backgroundValue}>{request.employmentStatus}</Text>
                </View>
                <View style={styles.backgroundRow}>
                  <Ionicons name="wallet-outline" size={16} color="#666" />
                  <Text style={styles.backgroundLabel}>Monthly Income:</Text>
                  <Text style={styles.backgroundValue}>₱{request.monthlyIncome.toLocaleString()}</Text>
                </View>
              </View>

              {/* Additional Notes */}
              {request.additionalNotes && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionLabel}>Additional Notes</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{request.additionalNotes}</Text>
                  </View>
                </>
              )}

              <Text style={styles.submittedDate}>Submitted on {request.submittedDate}</Text>

              {/* Action Buttons */}
              {request.status === "pending" && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.approveButton}
                    onPress={() => handleApprove(request.id)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.rejectButton}
                    onPress={() => handleReject(request.id)}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Contact Button */}
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => handleContactTenant(request.tenantPhone, request.tenantEmail, request.tenantName)}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#007AFF" />
                <Text style={styles.contactButtonText}>Contact Tenant</Text>
              </TouchableOpacity>

              {/* Status Messages */}
              {request.status === "approved" && (
                <View style={styles.approvedInfo}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.approvedInfoText}>
                    Booking approved! Tenant has been notified and can proceed to payment.
                  </Text>
                </View>
              )}

              {request.status === "rejected" && (
                <View style={styles.rejectedInfo}>
                  <Ionicons name="close-circle" size={16} color="#F44336" />
                  <Text style={styles.rejectedInfoText}>
                    This booking request was rejected. Tenant has been notified.
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
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  pendingBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  refreshButton: {
    padding: 4,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 8,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 16,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  tenantSection: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tenantAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tenantInfo: {
    flex: 1,
    justifyContent: "center",
  },
  tenantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  contactText: {
    fontSize: 12,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
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
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    width: 110,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  backgroundInfo: {
    gap: 10,
  },
  backgroundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backgroundLabel: {
    fontSize: 13,
    color: "#666",
    width: 110,
  },
  backgroundValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  notesBox: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  notesText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  submittedDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 12,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F44336",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rejectButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    gap: 8,
  },
  contactButtonText: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "600",
  },
  approvedInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  approvedInfoText: {
    flex: 1,
    fontSize: 12,
    color: "#2E7D32",
    lineHeight: 18,
  },
  rejectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  rejectedInfoText: {
    flex: 1,
    fontSize: 12,
    color: "#C62828",
    lineHeight: 18,
  },
});

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Contract {
  id: string;
  propertyName: string;
  unitNumber: string;
  landlordName: string;
  landlordContact: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: "Active" | "Expiring Soon" | "Expired" | "Terminated";
  signedDate: string;
  contractType: "Fixed-term" | "Month-to-month";
  terms: string[];
  documentUrl?: string;
}

export default function TenantContractsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "expiring" | "expired">("all");

  const [contracts, setContracts] = useState<Contract[]>([
    {
      id: "c1",
      propertyName: "Sunshine Apartments",
      unitNumber: "Unit 3A",
      landlordName: "Maria Santos",
      landlordContact: "+63 912 345 6789",
      startDate: "2024-11-01",
      endDate: "2025-11-01",
      monthlyRent: 15000,
      securityDeposit: 15000,
      status: "Active",
      signedDate: "2024-10-25",
      contractType: "Fixed-term",
      terms: [
        "Monthly rent due on the 1st of each month",
        "Security deposit refundable upon lease termination",
        "Tenant responsible for utilities",
        "30-day notice required for early termination",
        "No pets allowed without written permission"
      ],
      documentUrl: "https://example.com/contract-c1.pdf"
    },
    {
      id: "c2",
      propertyName: "Modern Studio Downtown",
      unitNumber: "12F",
      landlordName: "Juan Dela Cruz",
      landlordContact: "+63 917 234 5678",
      startDate: "2025-01-15",
      endDate: "2026-01-15",
      monthlyRent: 25000,
      securityDeposit: 25000,
      status: "Active",
      signedDate: "2025-01-10",
      contractType: "Fixed-term",
      terms: [
        "Monthly rent includes WiFi and cable TV",
        "Amenity fees included in rent",
        "Tenant must maintain renter's insurance",
        "60-day notice for non-renewal",
        "No subleasing without landlord approval"
      ],
      documentUrl: "https://example.com/contract-c2.pdf"
    },
    {
      id: "c3",
      propertyName: "Cozy University Dorm",
      unitNumber: "Room 205",
      landlordName: "Anna Garcia",
      landlordContact: "+63 920 123 4567",
      startDate: "2024-06-01",
      endDate: "2025-03-01",
      monthlyRent: 8000,
      securityDeposit: 8000,
      status: "Expired",
      signedDate: "2024-05-20",
      contractType: "Fixed-term",
      terms: [
        "School semester-based lease",
        "Common areas shared with other tenants",
        "Quiet hours enforced after 10 PM",
        "Kitchen and laundry access included",
        "No guests allowed overnight"
      ],
      documentUrl: "https://example.com/contract-c3.pdf"
    },
    {
      id: "c4",
      propertyName: "Beachside Transient",
      unitNumber: "Villa 7",
      landlordName: "Pedro Reyes",
      landlordContact: "+63 918 765 4321",
      startDate: "2026-04-15",
      endDate: "2026-10-15",
      monthlyRent: 20000,
      securityDeposit: 20000,
      status: "Expiring Soon",
      signedDate: "2026-04-01",
      contractType: "Fixed-term",
      terms: [
        "Seasonal rental agreement",
        "Full payment upfront required",
        "Property maintenance included",
        "Weekly cleaning service provided",
        "Damage deposit separate from security deposit"
      ]
    }
  ]);

  const filteredContracts = contracts.filter(contract => {
    if (filter === "all") return true;
    if (filter === "active") return contract.status === "Active";
    if (filter === "expiring") return contract.status === "Expiring Soon";
    if (filter === "expired") return contract.status === "Expired";
    return true;
  });

  const activeCount = contracts.filter(c => c.status === "Active").length;
  const expiringCount = contracts.filter(c => c.status === "Expiring Soon").length;

  const getStatusColor = (status: Contract["status"]) => {
    switch (status) {
      case "Active": return "#4CAF50";
      case "Expiring Soon": return "#FF9800";
      case "Expired": return "#999";
      case "Terminated": return "#FF3B30";
      default: return "#666";
    }
  };

  const handleViewContract = (contract: Contract) => {
    if (contract.documentUrl) {
      Alert.alert(
        "View Contract",
        `Opening contract document for ${contract.propertyName}`,
        [
          { text: "OK", onPress: () => console.log("Opening PDF:", contract.documentUrl) }
        ]
      );
    } else {
      Alert.alert("Notice", "Contract document not available");
    }
  };

  const handleDownloadContract = (contract: Contract) => {
    if (contract.documentUrl) {
      Alert.alert(
        "Download Contract",
        `Downloading contract for ${contract.propertyName}...`,
        [{ text: "OK" }]
      );
    } else {
      Alert.alert("Notice", "Contract document not available for download");
    }
  };

  const handleRenewContract = (contract: Contract) => {
    Alert.alert(
      "Renew Contract",
      `Would you like to request a contract renewal for ${contract.propertyName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Request",
          onPress: () => {
            Alert.alert("Success", "Renewal request sent to landlord");
          }
        }
      ]
    );
  };

  const handleContactLandlord = (contract: Contract) => {
    Alert.alert(
      `Contact ${contract.landlordName}`,
      `Phone: ${contract.landlordContact}`,
      [
        { text: "Call", onPress: () => Alert.alert("Calling", contract.landlordContact) },
        { text: "Message", onPress: () => Alert.alert("Messaging", contract.landlordName) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const renderContractCard = ({ item }: { item: Contract }) => (
    <View style={styles.contractCard}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons 
              name="file-document-outline" 
              size={24} 
              color="#007AFF" 
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.propertyName}>{item.propertyName}</Text>
            <Text style={styles.unitNumber}>{item.unitNumber}</Text>
          </View>
        </View>
        <View 
          style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(item.status) + '20' }
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Contract Period</Text>
              <Text style={styles.infoValue}>
                {item.startDate} → {item.endDate}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{item.contractType}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cash" size={16} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Monthly Rent</Text>
              <Text style={styles.infoValue}>₱{item.monthlyRent.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Security Deposit</Text>
              <Text style={styles.infoValue}>₱{item.securityDeposit.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Landlord</Text>
              <Text style={styles.infoValue}>{item.landlordName}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="create-outline" size={16} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Signed Date</Text>
              <Text style={styles.infoValue}>{item.signedDate}</Text>
            </View>
          </View>
        </View>

        {/* Terms Section */}
        {item.terms && item.terms.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.termsSection}>
              <Text style={styles.termsTitle}>Key Terms & Conditions:</Text>
              {item.terms.slice(0, 3).map((term, index) => (
                <View key={index} style={styles.termRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                  <Text style={styles.termText}>{term}</Text>
                </View>
              ))}
              {item.terms.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={() => handleViewContract(item)}
                >
                  <Text style={styles.viewMoreText}>
                    View all {item.terms.length} terms
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Landlord Contact */}
        <View style={styles.divider} />
        <TouchableOpacity 
          style={styles.landlordSection}
          onPress={() => handleContactLandlord(item)}
        >
          <Ionicons name="call-outline" size={16} color="#007AFF" />
          <Text style={styles.landlordContact}>Contact Landlord</Text>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Card Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewContract(item)}
        >
          <Ionicons name="eye-outline" size={18} color="#007AFF" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDownloadContract(item)}
        >
          <Ionicons name="download-outline" size={18} color="#007AFF" />
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>

        {(item.status === "Active" || item.status === "Expiring Soon") && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => handleRenewContract(item)}
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
              Renew
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Contracts</Text>
          <Text style={styles.headerSubtitle}>
            {activeCount} active contract{activeCount !== 1 ? 's' : ''}
            {expiringCount > 0 && ` • ${expiringCount} expiring soon`}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
        >
          {(["all", "active", "expiring", "expired"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contracts List */}
      <FlatList
        data={filteredContracts}
        keyExtractor={(item) => item.id}
        renderItem={renderContractCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="file-document-outline" 
              size={64} 
              color="#ccc" 
            />
            <Text style={styles.emptyStateText}>No contracts found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === "all" 
                ? "You don't have any rental contracts yet" 
                : `No ${filter} contracts`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterTabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
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
  listContainer: {
    padding: 16,
  },
  contractCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  unitNumber: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardBody: {
    padding: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  termsSection: {
    gap: 8,
  },
  termsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  termRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  termText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
    lineHeight: 18,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  viewMoreText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  landlordSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  landlordContact: {
    flex: 1,
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    gap: 4,
  },
  actionButtonPrimary: {
    backgroundColor: "#4CAF50",
  },
  actionButtonText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "600",
  },
  actionButtonTextPrimary: {
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
    textAlign: "center",
  },
});

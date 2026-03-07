import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Property {
  id: string;
  name: string;
  type: "Apartment" | "Dormitory" | "Condominium" | "Transient";
  address: string;
  unitNumber: string;
  monthlyRent: number;
  status: "Active" | "Pending" | "Expired";
  contractStart: string;
  contractEnd: string;
  imageUrl: string;
  landlordName: string;
  landlordContact: string;
  amenities: string[];
  nextPaymentDue: string;
  paymentStatus: "Paid" | "Due" | "Overdue";
}

export default function TenantPropertiesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "expired">("all");

  const [properties, setProperties] = useState<Property[]>([
    {
      id: "1",
      name: "Sunshine Apartments",
      type: "Apartment",
      address: "123 Main St, Makati City",
      unitNumber: "Unit 3A",
      monthlyRent: 15000,
      status: "Active",
      contractStart: "2024-11-01",
      contractEnd: "2025-11-01",
      imageUrl: "https://via.placeholder.com/120",
      landlordName: "Maria Santos",
      landlordContact: "+63 912 345 6789",
      amenities: ["WiFi", "Parking", "Security", "Laundry"],
      nextPaymentDue: "2026-04-01",
      paymentStatus: "Due"
    },
    {
      id: "2",
      name: "Modern Studio Downtown",
      type: "Condominium",
      address: "45 BGC, Taguig City",
      unitNumber: "12F",
      monthlyRent: 25000,
      status: "Active",
      contractStart: "2025-01-15",
      contractEnd: "2026-01-15",
      imageUrl: "https://via.placeholder.com/120",
      landlordName: "Juan Dela Cruz",
      landlordContact: "+63 917 234 5678",
      amenities: ["Pool", "Gym", "WiFi", "24/7 Security"],
      nextPaymentDue: "2026-03-15",
      paymentStatus: "Paid"
    },
    {
      id: "3",
      name: "Cozy University Dorm",
      type: "Dormitory",
      address: "789 University Ave, Quezon City",
      unitNumber: "Room 205",
      monthlyRent: 8000,
      status: "Expired",
      contractStart: "2024-06-01",
      contractEnd: "2025-03-01",
      imageUrl: "https://via.placeholder.com/120",
      landlordName: "Anna Garcia",
      landlordContact: "+63 920 123 4567",
      amenities: ["WiFi", "Study Area", "Kitchen"],
      nextPaymentDue: "-",
      paymentStatus: "Paid"
    }
  ]);

  const filteredProperties = properties.filter(property => {
    if (filter === "all") return true;
    return property.status.toLowerCase() === filter;
  });

  const activeCount = properties.filter(p => p.status === "Active").length;
  const pendingCount = properties.filter(p => p.status === "Pending").length;

  const getStatusColor = (status: Property["status"]) => {
    switch (status) {
      case "Active": return "#4CAF50";
      case "Pending": return "#FF9800";
      case "Expired": return "#999";
      default: return "#666";
    }
  };

  const getPaymentStatusColor = (status: Property["paymentStatus"]) => {
    switch (status) {
      case "Paid": return "#4CAF50";
      case "Due": return "#FF9800";
      case "Overdue": return "#FF3B30";
      default: return "#666";
    }
  };

  const handleContactLandlord = (property: Property) => {
    Alert.alert(
      `Contact ${property.landlordName}`,
      `Phone: ${property.landlordContact}`,
      [
        { text: "Call", onPress: () => Alert.alert("Calling", property.landlordContact) },
        { text: "Message", onPress: () => Alert.alert("Messaging", property.landlordName) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handlePayRent = (property: Property) => {
    router.push({
      pathname: "/tenant/payment",
      params: { propertyId: property.id, propertyName: property.name }
    });
  };

  const renderPropertyCard = ({ item }: { item: Property }) => (
    <View style={styles.propertyCard}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.imageUrl }} style={styles.propertyImage} />
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.propertyName}>{item.name}</Text>
          <Text style={styles.unitNumber}>{item.unitNumber}</Text>
          <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status) + '20'}]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.address}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="home-city-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.type}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.contractStart} → {item.contractEnd}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.rentRow}>
          <View>
            <Text style={styles.rentLabel}>Monthly Rent</Text>
            <Text style={styles.rentAmount}>₱{item.monthlyRent.toLocaleString()}</Text>
          </View>
          {item.status === "Active" && (
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>Next Payment</Text>
              <View style={styles.paymentStatusRow}>
                <View 
                  style={[
                    styles.paymentStatusDot, 
                    { backgroundColor: getPaymentStatusColor(item.paymentStatus) }
                  ]} 
                />
                <Text style={[styles.paymentDueDate, { color: getPaymentStatusColor(item.paymentStatus) }]}>
                  {item.nextPaymentDue}
                </Text>
              </View>
            </View>
          )}
        </View>

        {item.amenities && item.amenities.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.amenitiesSection}>
              <Text style={styles.amenitiesLabel}>Amenities:</Text>
              <View style={styles.amenitiesRow}>
                {item.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {item.status === "Active" && (
          <>
            <View style={styles.divider} />
            <View style={styles.landlordSection}>
              <Text style={styles.landlordLabel}>Landlord: {item.landlordName}</Text>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => handleContactLandlord(item)}
              >
                <Ionicons name="call-outline" size={16} color="#007AFF" />
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push({
            pathname: "/tenant/property/[id]",
            params: { id: item.id }
          })}
        >
          <Ionicons name="information-circle-outline" size={18} color="#007AFF" />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>

        {item.status === "Active" && item.paymentStatus !== "Paid" && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => handlePayRent(item)}
          >
            <Ionicons name="card-outline" size={18} color="#fff" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
              Pay Rent
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push("/tenant/contracts")}
        >
          <MaterialCommunityIcons name="file-document-outline" size={18} color="#007AFF" />
          <Text style={styles.actionButtonText}>Contract</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Properties</Text>
          <Text style={styles.headerSubtitle}>
            {activeCount} active rental{activeCount !== 1 ? 's' : ''}
            {pendingCount > 0 && ` • ${pendingCount} pending`}
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
          {(["all", "active", "pending", "expired"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Properties List */}
      <FlatList
        data={filteredProperties}
        keyExtractor={(item) => item.id}
        renderItem={renderPropertyCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="home-search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No properties found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === "all" 
                ? "You don't have any rented properties yet" 
                : `No ${filter} properties`}
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push("/tenant/browse-properties")}
            >
              <Ionicons name="search-outline" size={20} color="#fff" />
              <Text style={styles.browseButtonText}>Browse Properties</Text>
            </TouchableOpacity>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
  propertyCard: {
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  unitNumber: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  rentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rentLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  rentAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  paymentInfo: {
    alignItems: "flex-end",
  },
  paymentLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  paymentStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentDueDate: {
    fontSize: 13,
    fontWeight: "600",
  },
  amenitiesSection: {
    marginTop: 4,
  },
  amenitiesLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  amenityChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 11,
    color: "#666",
  },
  landlordSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  landlordLabel: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
  },
  contactButtonText: {
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
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 20,
    gap: 8,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

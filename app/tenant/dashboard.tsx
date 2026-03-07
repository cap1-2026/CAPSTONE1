import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "all" | "properties" | "payments" | "contracts";

export default function TenantDashboard() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<TabType>("all");

  // Mock data
  const dashboardData = {
    properties: [
      {
        id: "1",
        name: "Sunshine Apartments",
        unit: "Unit 3A",
        rent: 15000,
        paymentDue: "2026-04-01",
        paymentStatus: "Due",
        daysUntilDue: 5
      },
      {
        id: "2",
        name: "Modern Studio Downtown",
        unit: "12F",
        rent: 25000,
        paymentDue: "2026-03-15",
        paymentStatus: "Paid",
        daysUntilDue: -10
      }
    ],
    contracts: [
      {
        id: "c1",
        property: "Sunshine Apartments",
        unit: "Unit 3A",
        expiryDate: "2025-11-01",
        daysUntilExpiry: 239,
        status: "Active"
      },
      {
        id: "c2",
        property: "Modern Studio Downtown",
        unit: "12F",
        expiryDate: "2026-01-15",
        daysUntilExpiry: 314,
        status: "Active"
      }
    ]
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "#4CAF50";
      case "Due": return "#FF9800";
      case "Overdue": return "#FF3B30";
      default: return "#666";
    }
  };

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
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContentContainer}
      >
        <TouchableOpacity 
          style={[styles.tab, selectedTab === "all" && styles.tabActive]}
          onPress={() => setSelectedTab("all")}
        >
          <Ionicons 
            name="apps" 
            size={20} 
            color={selectedTab === "all" ? "#007AFF" : "#666"} 
          />
          <Text style={[styles.tabText, selectedTab === "all" && styles.tabTextActive]}>
            View All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, selectedTab === "properties" && styles.tabActive]}
          onPress={() => setSelectedTab("properties")}
        >
          <MaterialCommunityIcons 
            name="home-city" 
            size={20} 
            color={selectedTab === "properties" ? "#007AFF" : "#666"} 
          />
          <Text style={[styles.tabText, selectedTab === "properties" && styles.tabTextActive]}>
            Properties
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, selectedTab === "payments" && styles.tabActive]}
          onPress={() => setSelectedTab("payments")}
        >
          <Ionicons 
            name="card" 
            size={20} 
            color={selectedTab === "payments" ? "#007AFF" : "#666"} 
          />
          <Text style={[styles.tabText, selectedTab === "payments" && styles.tabTextActive]}>
            Payments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, selectedTab === "contracts" && styles.tabActive]}
          onPress={() => setSelectedTab("contracts")}
        >
          <MaterialCommunityIcons 
            name="file-document" 
            size={20} 
            color={selectedTab === "contracts" ? "#007AFF" : "#666"} 
          />
          <Text style={[styles.tabText, selectedTab === "contracts" && styles.tabTextActive]}>
            Contracts
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={styles.content}>
        {/* My Properties Tab */}
        {(selectedTab === "all" || selectedTab === "properties") && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Properties</Text>
            </View>
            {dashboardData.properties.map((property) => (
              <TouchableOpacity 
                key={property.id} 
                style={styles.propertyCard}
                onPress={() => router.push({
                  pathname: "/tenant/property/[id]",
                  params: { id: property.id }
                })}
              >
                <View style={styles.propertyIconCircle}>
                  <MaterialCommunityIcons name="home" size={24} color="#007AFF" />
                </View>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyName}>{property.name}</Text>
                  <Text style={styles.propertyUnit}>{property.unit}</Text>
                  <Text style={styles.propertyRent}>₱{property.rent.toLocaleString()}/month</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Payments Tab */}
        {(selectedTab === "all" || selectedTab === "payments") && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payments</Text>
            </View>
            {dashboardData.properties.map((property) => (
              <View key={property.id} style={styles.paymentCard}>
                <View style={styles.paymentLeft}>
                  <View style={[styles.paymentIcon, { backgroundColor: getPaymentStatusColor(property.paymentStatus) + '20' }]}>
                    <MaterialCommunityIcons 
                      name="home-outline" 
                      size={20} 
                      color={getPaymentStatusColor(property.paymentStatus)} 
                    />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentPropertyName}>{property.name}</Text>
                    <Text style={styles.paymentUnit}>{property.unit}</Text>
                    <Text style={styles.paymentDueDate}>Due: {property.paymentDue}</Text>
                  </View>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>₱{property.rent.toLocaleString()}</Text>
                  <View 
                    style={[
                      styles.paymentStatusBadge, 
                      { backgroundColor: getPaymentStatusColor(property.paymentStatus) }
                    ]}
                  >
                    <Text style={styles.paymentStatusText}>{property.paymentStatus}</Text>
                  </View>
                  {property.paymentStatus === "Due" && (
                    <TouchableOpacity 
                      style={styles.payButton}
                      onPress={() => router.push("/tenant/payment")}
                    >
                      <Text style={styles.payButtonText}>Pay Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Contracts Tab */}
        {(selectedTab === "all" || selectedTab === "contracts") && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contracts</Text>
            </View>
            {dashboardData.contracts.map((contract) => (
              <TouchableOpacity 
                key={contract.id} 
                style={styles.contractCard}
                onPress={() => router.push("/tenant/contracts")}
              >
                <View style={styles.contractIconCircle}>
                  <MaterialCommunityIcons name="file-document-outline" size={24} color="#4CAF50" />
                </View>
                <View style={styles.contractInfo}>
                  <Text style={styles.contractProperty}>{contract.property}</Text>
                  <Text style={styles.contractUnit}>{contract.unit}</Text>
                  <Text style={styles.contractExpiry}>
                    Expires: {contract.expiryDate} ({contract.daysUntilExpiry} days)
                  </Text>
                </View>
                <View style={styles.contractStatusBadge}>
                  <Text style={styles.contractStatusText}>{contract.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
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
  tabContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tabContentContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#007AFF",
  },
  content: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: "#fff",
    margin: 12,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  seeAllText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "600",
  },
  paymentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 6,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentPropertyName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  paymentUnit: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  paymentDueDate: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  paymentRight: {
    alignItems: "flex-end",
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  paymentStatusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  payButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  propertyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 6,
  },
  propertyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  propertyUnit: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  propertyRent: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
    marginTop: 4,
  },
  contractCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 6,
  },
  contractIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  contractInfo: {
    flex: 1,
  },
  contractProperty: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  contractUnit: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  contractExpiry: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  contractStatusBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contractStatusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function OwnerDashboard() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("overview");

  const menuItems = [
    { id: "overview", label: "Overview", icon: "view-dashboard" },
    { id: "properties", label: "My Properties", icon: "home-city" },
    { id: "tenants", label: "Tenants", icon: "account-group" },
    { id: "payments", label: "Payments", icon: "wallet" },
    { id: "contracts", label: "Contracts", icon: "file-document" },
  ];

  const stats = [
    { icon: "cash", iconColor: "#10B981", label: "Total Revenue", value: "₱45,000", sublabel: "This Month" },
    { icon: "home-city", iconColor: "#3B82F6", label: "Active", value: "8", sublabel: "Properties Listed" },
    { icon: "account-multiple", iconColor: "#8B5CF6", label: "Occupied", value: "23/30", sublabel: "Units Rented" },
    { icon: "calendar", iconColor: "#F59E0B", label: "Pending", value: "2", sublabel: "Payment Due" },
  ];

  const recentActivity = [
    { type: "payment", tenant: "Juan Dela Cruz", property: "Sunshine Apartments Unit 3A", amount: "₱15,000", date: "March 5, 2026", status: "Received" },
    { type: "booking", tenant: "Maria Santos", property: "Maple Dorms Room 12", amount: "₱3,500", date: "March 4, 2026", status: "Pending" },
    { type: "contract", tenant: "Pedro Reyes", property: "City View Condo Unit 5B", amount: "N/A", date: "March 3, 2026", status: "Signed" },
  ];

  const featuredProperty = {
    name: "Sunshine Apartments Unit 3A",
    address: "123 Main St, Makati City",
    monthlyRent: 15000,
    status: "Active",
    tenant: "Juan Dela Cruz",
    leaseEnds: "March 14, 2027",
    imageUri: "https://via.placeholder.com/300x150",
  };

  function handleMenuClick(itemId: string) {
    setActiveMenu(itemId);
    // Navigate to respective pages
    switch (itemId) {
      case "properties":
        router.push("/owner/properties");
        break;
      case "tenants":
        router.push("/owner/tenants");
        break;
      case "payments":
        router.push("/owner/financials");
        break;
      case "contracts":
        router.push("/owner/contracts");
        break;
    }
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>My Rental Dashboard</Text>
          <Text style={styles.welcomeText}>Welcome back, Property Owner!</Text>
        </View>
      </View>

      {/* Quick Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navScroll}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.navItem, activeMenu === item.id && styles.navItemActive]}
            onPress={() => handleMenuClick(item.id)}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={24}
              color={activeMenu === item.id ? "#007AFF" : "#666"}
            />
            <Text style={[styles.navLabel, activeMenu === item.id && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Property */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Rental</Text>
        <View style={styles.propertyCard}>
          <Image source={{ uri: featuredProperty.imageUri }} style={styles.propertyImage} />
          <View style={styles.propertyDetails}>
            <View style={styles.propertyHeader}>
              <View>
                <Text style={styles.propertyName}>{featuredProperty.name}</Text>
                <Text style={styles.propertyAddress}>{featuredProperty.address}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{featuredProperty.status}</Text>
              </View>
            </View>

            <View style={styles.propertyInfo}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Monthly Rent:</Text>
                  <Text style={styles.infoValue}>₱{featuredProperty.monthlyRent.toLocaleString()}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Lease Ends:</Text>
                  <Text style={styles.infoValue}>{featuredProperty.leaseEnds}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <MaterialCommunityIcons name={stat.icon as any} size={32} color={stat.iconColor} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statSublabel}>{stat.sublabel}</Text>
          </View>
        ))}
      </View>

      {/* Next Payment Section */}
      <View style={styles.section}>
        <View style={styles.paymentCard}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Next Rent Payment Due</Text>
            <Text style={styles.paymentAmount}>₱15,000</Text>
            <Text style={styles.paymentDate}>Due on March 5, 2026</Text>
          </View>
          <TouchableOpacity style={styles.paymentButton} onPress={() => router.push("/owner/financials")}>
            <Text style={styles.paymentButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
            {recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityIconCircle, { backgroundColor: getActivityColor(activity.type) }]}>
                  <MaterialCommunityIcons
                    name={getActivityIcon(activity.type)}
                    size={20}
                    color="#fff"
                  />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTenant}>{activity.tenant}</Text>
                  <Text style={styles.activityProperty}>{activity.property}</Text>
                  <Text style={styles.activityDate}>{activity.date}</Text>
                </View>
                <View style={styles.activityRight}>
                  <Text style={styles.activityAmount}>{activity.amount}</Text>
                  <View style={[styles.activityStatusBadge, { backgroundColor: getStatusColor(activity.status) }]}>
                    <Text style={styles.activityStatusText}>{activity.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
  );
}

function getActivityIcon(type: string): any {
  switch (type) {
    case "payment":
      return "cash";
    case "booking":
      return "calendar-check";
    case "contract":
      return "file-document";
    default:
      return "information";
  }
}

function getActivityColor(type: string): string {
  switch (type) {
    case "payment":
      return "#10B981";
    case "booking":
      return "#3B82F6";
    case "contract":
      return "#8B5CF6";
    default:
      return "#6B7280";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "Received":
    case "Signed":
      return "#D1FAE5";
    case "Pending":
      return "#FEF3C7";
    default:
      return "#F3F4F6";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { backgroundColor: "#fff", padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  pageTitle: { fontSize: 28, fontWeight: "700", color: "#111827" },
  welcomeText: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  navScroll: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingVertical: 12 },
  navItem: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 8, marginHorizontal: 4, borderRadius: 10 },
  navItemActive: { backgroundColor: "#EFF6FF" },
  navLabel: { fontSize: 12, color: "#6B7280", marginTop: 4, fontWeight: "500" },
  navLabelActive: { color: "#007AFF", fontWeight: "600" },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 12, marginTop: 8 },
  propertyCard: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  propertyImage: { width: "100%", height: 180, backgroundColor: "#E5E7EB" },
  propertyDetails: { padding: 16 },
  propertyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  propertyName: { fontSize: 18, fontWeight: "700", color: "#111827", flex: 1 },
  propertyAddress: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  statusBadge: { backgroundColor: "#D1FAE5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: "600", color: "#059669" },
  propertyInfo: { gap: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, marginBottom: 8 },
  statCard: { flex: 1, minWidth: "45%", backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: "700", color: "#111827", marginTop: 8 },
  statLabel: { fontSize: 14, fontWeight: "600", color: "#111827", marginTop: 4, textAlign: "center" },
  statSublabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  paymentCard: { backgroundColor: "#EFF6FF", borderRadius: 16, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontSize: 14, fontWeight: "600", color: "#1E40AF", marginBottom: 6 },
  paymentAmount: { fontSize: 28, fontWeight: "700", color: "#1E40AF", marginBottom: 4 },
  paymentDate: { fontSize: 13, color: "#3B82F6" },
  paymentButton: { backgroundColor: "#007AFF", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  paymentButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  activityList: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  activityItem: { flexDirection: "row", padding: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", alignItems: "center", gap: 10 },
  activityIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  activityDetails: { flex: 1 },
  activityTenant: { fontSize: 14, fontWeight: "600", color: "#111827" },
  activityProperty: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  activityDate: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  activityRight: { alignItems: "flex-end", gap: 4 },
  activityAmount: { fontSize: 13, fontWeight: "600", color: "#111827" },
  activityStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activityStatusText: { fontSize: 10, fontWeight: "600", color: "#059669" },
});

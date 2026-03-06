import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type TenantFilter = "all" | "active" | "pending" | "overdue";

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyName: string;
  propertyAddress: string;
  unit: string;
  monthlyRent: number;
  leaseStart: string;
  leaseEnd: string;
  status: "active" | "pending" | "overdue";
  paymentStatus: "paid" | "due" | "overdue";
  lastPaymentDate?: string;
  nextPaymentDue?: string;
  securityDeposit: number;
  balance: number;
  employmentStatus: string;
  emergencyContact: string;
}

export default function TenantsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<TenantFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [tenants] = useState<Tenant[]>([
    {
      id: "1",
      name: "Carlos Reyes",
      email: "carlos.reyes@email.com",
      phone: "+63 918 345 6789",
      propertyName: "Cozy 2BR Condo",
      propertyAddress: "789 Ortigas, Pasig City",
      unit: "Unit 5B",
      monthlyRent: 25000,
      leaseStart: "02/01/2026",
      leaseEnd: "02/01/2028",
      status: "active",
      paymentStatus: "paid",
      lastPaymentDate: "03/01/2026",
      nextPaymentDue: "04/01/2026",
      securityDeposit: 25000,
      balance: 0,
      employmentStatus: "Full-time Employee",
      emergencyContact: "+63 917 111 2222"
    },
    {
      id: "2",
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+63 912 345 6789",
      propertyName: "Sunshine Apartments Unit 3A",
      propertyAddress: "123 Main St, Makati City",
      unit: "Unit 3A",
      monthlyRent: 15000,
      leaseStart: "03/01/2026",
      leaseEnd: "03/01/2027",
      status: "pending",
      paymentStatus: "due",
      nextPaymentDue: "04/05/2026",
      securityDeposit: 15000,
      balance: 15000,
      employmentStatus: "Full-time Employee",
      emergencyContact: "+63 917 234 5678"
    },
    {
      id: "3",
      name: "Maria Santos",
      email: "maria.santos@email.com",
      phone: "+63 917 234 5678",
      propertyName: "Modern Studio Downtown",
      propertyAddress: "456 BGC, Taguig City",
      unit: "Studio 12C",
      monthlyRent: 18000,
      leaseStart: "01/15/2026",
      leaseEnd: "07/15/2026",
      status: "active",
      paymentStatus: "paid",
      lastPaymentDate: "03/01/2026",
      nextPaymentDue: "04/01/2026",
      securityDeposit: 18000,
      balance: 0,
      employmentStatus: "Freelancer",
      emergencyContact: "+63 918 765 4321"
    },
    {
      id: "4",
      name: "Pedro Martinez",
      email: "pedro.martinez@email.com",
      phone: "+63 919 876 5432",
      propertyName: "Sunshine Apartments Unit 2B",
      propertyAddress: "123 Main St, Makati City",
      unit: "Unit 2B",
      monthlyRent: 15000,
      leaseStart: "12/01/2025",
      leaseEnd: "12/01/2026",
      status: "active",
      paymentStatus: "overdue",
      lastPaymentDate: "02/01/2026",
      nextPaymentDue: "03/01/2026",
      securityDeposit: 15000,
      balance: 15000,
      employmentStatus: "Business Owner",
      emergencyContact: "+63 917 222 3333"
    }
  ]);

  const filteredTenants = tenants.filter(tenant => {
    const matchesFilter = filter === "all" || tenant.status === filter || tenant.paymentStatus === filter;
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tenant.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tenant.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeCount = tenants.filter(t => t.status === "active").length;
  const pendingCount = tenants.filter(t => t.status === "pending").length;
  const overdueCount = tenants.filter(t => t.paymentStatus === "overdue").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#4CAF50";
      case "pending": return "#FF9800";
      case "overdue": return "#F44336";
      default: return "#999";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "#4CAF50";
      case "due": return "#FF9800";
      case "overdue": return "#F44336";
      default: return "#999";
    }
  };

  const handleContactTenant = (tenant: Tenant) => {
    Alert.alert(
      `Contact ${tenant.name}`,
      `Choose contact method:`,
      [
        { text: "Call", onPress: () => Alert.alert("Phone", `Calling ${tenant.phone}`) },
        { text: "Email", onPress: () => Alert.alert("Email", `Email: ${tenant.email}`) },
        { text: "Message", onPress: () => Alert.alert("Messages", "Messaging feature coming soon!") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handlePaymentReminder = (tenant: Tenant) => {
    Alert.alert(
      "Send Payment Reminder",
      `Send payment reminder to ${tenant.name} for ${tenant.propertyName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: () => Alert.alert("Success", "Payment reminder sent successfully!")
        }
      ]
    );
  };

  const handleViewDetails = (tenant: Tenant) => {
    Alert.alert(
      tenant.name,
      `Property: ${tenant.propertyName}\nUnit: ${tenant.unit}\nRent: ₱${tenant.monthlyRent.toLocaleString()}/month\nLease: ${tenant.leaseStart} - ${tenant.leaseEnd}\nStatus: ${tenant.status}\nPayment: ${tenant.paymentStatus}\n\nView full tenant profile?`,
      [
        { text: "Close", style: "cancel" },
        { text: "View Profile", onPress: () => Alert.alert("Profile", "Full tenant profile coming soon!") }
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
          <Text style={styles.headerTitle}>Tenant Management</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>{activeCount} Active</Text>
            </View>
            {pendingCount > 0 && (
              <View style={[styles.statBadge, styles.pendingBadge]}>
                <Text style={styles.statBadgeText}>{pendingCount} Pending</Text>
              </View>
            )}
            {overdueCount > 0 && (
              <View style={[styles.statBadge, styles.overdueBadge]}>
                <Text style={styles.statBadgeText}>{overdueCount} Overdue</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.bookingsButton}
          onPress={() => router.push("/owner/bookings" as any)}
        >
          <Ionicons name="calendar" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tenants, properties..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(["all", "active", "pending", "overdue"] as TenantFilter[]).map((f) => (
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

      {/* Tenants List */}
      <ScrollView style={styles.tenantsList}>
        {filteredTenants.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No tenants found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? "Try a different search term" : `No ${filter} tenants`}
            </Text>
          </View>
        ) : (
          filteredTenants.map((tenant) => (
            // @ts-ignore - React key prop is valid
            <TouchableOpacity
              key={tenant.id}
              style={styles.tenantCard}
              onPress={() => handleViewDetails(tenant)}
              activeOpacity={0.7}
            >
              {/* Tenant Avatar & Basic Info */}
              <View style={styles.tenantHeader}>
                <View style={styles.tenantAvatar}>
                  <Ionicons name="person" size={32} color="#007AFF" />
                </View>
                <View style={styles.tenantBasicInfo}>
                  <Text style={styles.tenantName}>{tenant.name}</Text>
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={12} color="#666" />
                    <Text style={styles.contactText}>{tenant.phone}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={12} color="#666" />
                    <Text style={styles.contactText}>{tenant.email}</Text>
                  </View>
                </View>
                <View style={styles.statusBadges}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tenant.status) }]}>
                    <Text style={styles.statusBadgeText}>{tenant.status.toUpperCase()}</Text>
                  </View>
                  <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(tenant.paymentStatus) }]}>
                    <Ionicons name="cash" size={12} color="#fff" />
                    <Text style={styles.paymentBadgeText}>{tenant.paymentStatus}</Text>
                  </View>
                </View>
              </View>

              {/* Property Info */}
              <View style={styles.divider} />
              <View style={styles.propertySection}>
                <Ionicons name="home" size={16} color="#007AFF" />
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyName}>{tenant.propertyName}</Text>
                  <Text style={styles.propertyDetails}>{tenant.unit} • {tenant.propertyAddress}</Text>
                </View>
              </View>

              {/* Financial Info */}
              <View style={styles.financialGrid}>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Monthly Rent</Text>
                  <Text style={styles.financialValue}>₱{tenant.monthlyRent.toLocaleString()}</Text>
                </View>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Balance</Text>
                  <Text style={[styles.financialValue, tenant.balance > 0 && styles.balanceOverdue]}>
                    ₱{tenant.balance.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Lease End</Text>
                  <Text style={styles.financialValue}>{tenant.leaseEnd}</Text>
                </View>
              </View>

              {/* Payment Info */}
              {tenant.nextPaymentDue && (
                <View style={styles.paymentInfo}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.paymentInfoText}>
                    {tenant.paymentStatus === "paid" && tenant.lastPaymentDate
                      ? `Last payment: ${tenant.lastPaymentDate}`
                      : `Payment due: ${tenant.nextPaymentDue}`}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleContactTenant(tenant)}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Contact</Text>
                </TouchableOpacity>

                {tenant.paymentStatus !== "paid" && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.reminderButton]}
                    onPress={() => handlePaymentReminder(tenant)}
                  >
                    <Ionicons name="notifications-outline" size={18} color="#FF9800" />
                    <Text style={[styles.actionButtonText, styles.reminderButtonText]}>
                      Remind
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={[styles.actionButton, styles.detailsButton]}
                  onPress={() => handleViewDetails(tenant)}
                >
                  <Ionicons name="information-circle-outline" size={18} color="#666" />
                  <Text style={[styles.actionButtonText, styles.detailsButtonText]}>
                    Details
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Overdue Warning */}
              {tenant.paymentStatus === "overdue" && (
                <View style={styles.overdueWarning}>
                  <Ionicons name="warning" size={16} color="#F44336" />
                  <Text style={styles.overdueWarningText}>
                    Payment overdue! Last payment: {tenant.lastPaymentDate || "N/A"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Quick Actions Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push("/owner/bookings" as any)}
        >
          <Ionicons name="calendar-outline" size={20} color="#007AFF" />
          <Text style={styles.footerButtonText}>Bookings</Text>
          {pendingCount > 0 && (
            <View style={styles.footerBadge}>
              <Text style={styles.footerBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push("/owner/notifications")}
        >
          <Ionicons name="notifications-outline" size={20} color="#007AFF" />
          <Text style={styles.footerButtonText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push("/owner/financials")}
        >
          <Ionicons name="stats-chart-outline" size={20} color="#007AFF" />
          <Text style={styles.footerButtonText}>Financials</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
  },
  statBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pendingBadge: {
    backgroundColor: "#FF9800",
  },
  overdueBadge: {
    backgroundColor: "#F44336",
  },
  statBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  bookingsButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
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
  tenantsList: {
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
  tenantCard: {
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
  tenantHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  tenantAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tenantBasicInfo: {
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
    marginTop: 3,
  },
  contactText: {
    fontSize: 12,
    color: "#666",
  },
  statusBadges: {
    alignItems: "flex-end",
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    textTransform: "capitalize",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  propertySection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  propertyDetails: {
    fontSize: 12,
    color: "#666",
  },
  financialGrid: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  financialItem: {
    flex: 1,
    alignItems: "center",
  },
  financialLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  balanceOverdue: {
    color: "#F44336",
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    padding: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  paymentInfoText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
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
  actionButtonText: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "600",
  },
  reminderButton: {
    borderColor: "#FF9800",
  },
  reminderButtonText: {
    color: "#FF9800",
  },
  detailsButton: {
    borderColor: "#999",
  },
  detailsButtonText: {
    color: "#666",
  },
  overdueWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  overdueWarningText: {
    flex: 1,
    fontSize: 12,
    color: "#C62828",
    fontWeight: "600",
  },
  footer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 8,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    position: "relative",
  },
  footerButtonText: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "600",
  },
  footerBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  footerBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});

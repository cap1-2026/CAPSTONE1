import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type NotificationType = "all" | "booking" | "payment" | "tenant" | "property" | "review" | "system";

interface Notification {
  id: string;
  type: Exclude<NotificationType, "all">;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRequired?: boolean;
  actionType?: "approve" | "review" | "respond" | "view";
  bookingId?: string;
  tenantName?: string;
  propertyName?: string;
  amount?: number;
}

export default function OwnerNotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationType>("all");

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "booking",
      title: "New Booking Request 📋",
      message: "John Doe has submitted a booking request for Sunshine Apartments Unit 3A. Review the application and approve or decline.",
      timestamp: "10 minutes ago",
      isRead: false,
      actionRequired: true,
      actionType: "approve",
      bookingId: "1",
      tenantName: "John Doe",
      propertyName: "Sunshine Apartments Unit 3A"
    },
    {
      id: "2",
      type: "booking",
      title: "New Booking Request 📋",
      message: "Maria Santos is interested in Modern Studio Downtown and has submitted a booking request for 6 months lease.",
      timestamp: "1 hour ago",
      isRead: false,
      actionRequired: true,
      actionType: "approve",
      bookingId: "2",
      tenantName: "Maria Santos",
      propertyName: "Modern Studio Downtown"
    },
    {
      id: "3",
      type: "payment",
      title: "Payment Received 💰",
      message: "Payment of ₱15,000 has been received from John Doe for Sunshine Apartments Unit 3A (March 2026 rent).",
      timestamp: "2 hours ago",
      isRead: false,
      amount: 15000,
      tenantName: "John Doe",
      propertyName: "Sunshine Apartments Unit 3A"
    },
    {
      id: "4",
      type: "tenant",
      title: "Tenant Inquiry",
      message: "Sarah Lee has sent you a message regarding the availability of Cozy 2BR Condo.",
      timestamp: "3 hours ago",
      isRead: true,
      actionRequired: true,
      actionType: "respond",
      tenantName: "Sarah Lee",
      propertyName: "Cozy 2BR Condo"
    },
    {
      id: "5",
      type: "review",
      title: "New Review Posted ⭐",
      message: "John Doe left a 5-star review for Sunshine Apartments Unit 3A. Great feedback on cleanliness and location!",
      timestamp: "5 hours ago",
      isRead: true,
      actionRequired: true,
      actionType: "review",
      tenantName: "John Doe",
      propertyName: "Sunshine Apartments Unit 3A"
    },
    {
      id: "6",
      type: "property",
      title: "Property Listing Active",
      message: "Your property 'Luxe Studio in BGC' has been successfully approved and is now visible to tenants.",
      timestamp: "1 day ago",
      isRead: true,
      propertyName: "Luxe Studio in BGC"
    },
    {
      id: "7",
      type: "tenant",
      title: "Maintenance Request",
      message: "Maria Santos reported a maintenance issue in Modern Studio Downtown - Leaking faucet in bathroom.",
      timestamp: "2 days ago",
      isRead: true,
      actionRequired: true,
      actionType: "respond",
      tenantName: "Maria Santos",
      propertyName: "Modern Studio Downtown"
    },
    {
      id: "8",
      type: "payment",
      title: "Payment Overdue ⚠️",
      message: "Rent payment for Cozy 2BR Condo is 5 days overdue. Contact tenant Carlos Reyes.",
      timestamp: "3 days ago",
      isRead: false,
      actionRequired: true,
      actionType: "respond",
      tenantName: "Carlos Reyes",
      propertyName: "Cozy 2BR Condo"
    },
    {
      id: "9",
      type: "system",
      title: "Monthly Revenue Report Available",
      message: "Your monthly financial report for February 2026 is now available. Total revenue: ₱125,000.",
      timestamp: "1 week ago",
      isRead: true,
      actionRequired: true,
      actionType: "view",
      amount: 125000
    },
    {
      id: "10",
      type: "system",
      title: "Welcome to PadFinder Owner Portal!",
      message: "Thank you for joining PadFinder. Start by listing your properties and managing booking requests.",
      timestamp: "2 weeks ago",
      isRead: true
    }
  ]);

  const filteredNotifications = notifications.filter(notif => {
    return filter === "all" || notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.isRead).length;

  const getNotificationIcon = (type: Exclude<NotificationType, "all">) => {
    switch (type) {
      case "booking": return "calendar";
      case "payment": return "cash";
      case "tenant": return "person";
      case "property": return "home";
      case "review": return "star";
      case "system": return "information-circle";
      default: return "notifications";
    }
  };

  const getNotificationColor = (type: Exclude<NotificationType, "all">) => {
    switch (type) {
      case "booking": return "#2196F3";
      case "payment": return "#4CAF50";
      case "tenant": return "#FF9800";
      case "property": return "#00BCD4";
      case "review": return "#FFD700";
      case "system": return "#9C27B0";
      default: return "#666";
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const deleteNotification = (notificationId: string) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
          }
        }
      ]
    );
  };

  const handleAction = (notification: Notification) => {
    markAsRead(notification.id);
    
    switch (notification.actionType) {
      case "approve":
        // Navigate to bookings page to approve/decline
        Alert.alert(
          "Review Booking Request",
          `Review and approve booking request from ${notification.tenantName}?`,
          [
            { text: "View Details", onPress: () => router.push("/owner/bookings" as any) },
            { text: "Cancel", style: "cancel" }
          ]
        );
        break;
      case "review":
        router.push("/owner/review");
        break;
      case "respond":
        Alert.alert(
          "Response Required",
          `Would you like to respond to ${notification.tenantName}?`,
          [
            { text: "Send Message", onPress: () => {
              Alert.alert("Messages", "Messaging feature coming soon!");
            }},
            { text: "Cancel", style: "cancel" }
          ]
        );
        break;
      case "view":
        router.push("/owner/financials");
        break;
      default:
        break;
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
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
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.badgeContainer}>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
              </View>
            )}
            {actionRequiredCount > 0 && (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{actionRequiredCount} require action</Text>
              </View>
            )}
          </View>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Ionicons name="checkmark-done" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
        >
          {(["all", "booking", "payment", "tenant", "property", "review", "system"] as NotificationType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Ionicons 
                name={f === "all" ? "apps" : getNotificationIcon(f as Exclude<NotificationType, "all">) as any} 
                size={14} 
                color={filter === f ? "#fff" : "#666"} 
              />
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No notifications found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === "all" 
                ? "You're all caught up!" 
                : `No ${filter} notifications`}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            // @ts-ignore - React key prop is valid
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.notificationCardUnread,
                notification.actionRequired && !notification.isRead && styles.notificationCardAction
              ]}
              onPress={() => markAsRead(notification.id)}
              activeOpacity={0.7}
            >
              {/* Icon */}
              <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(notification.type) }]}>
                <Ionicons 
                  name={getNotificationIcon(notification.type) as any}
                  size={24} 
                  color="#fff" 
                />
              </View>

              {/* Content */}
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <View style={styles.badges}>
                    {!notification.isRead && (
                      <View style={styles.unreadDot} />
                    )}
                    {notification.actionRequired && !notification.isRead && (
                      <View style={styles.actionFlag}>
                        <Ionicons name="alert-circle" size={14} color="#FF3B30" />
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.notificationMessage}>{notification.message}</Text>

                {/* Metadata Tags */}
                <View style={styles.metadataContainer}>
                  {notification.tenantName && (
                    <View style={styles.metadataTag}>
                      <Ionicons name="person-outline" size={12} color="#666" />
                      <Text style={styles.metadataText}>{notification.tenantName}</Text>
                    </View>
                  )}
                  {notification.propertyName && (
                    <View style={styles.metadataTag}>
                      <Ionicons name="home-outline" size={12} color="#666" />
                      <Text style={styles.metadataText}>{notification.propertyName}</Text>
                    </View>
                  )}
                  {notification.amount && (
                    <View style={[styles.metadataTag, styles.amountTag]}>
                      <Ionicons name="cash-outline" size={12} color="#4CAF50" />
                      <Text style={styles.amountText}>₱{notification.amount.toLocaleString()}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.notificationTimestamp}>{notification.timestamp}</Text>

                {/* Action Buttons */}
                {notification.actionRequired && notification.actionType === "approve" && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleAction(notification)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Review Booking Request</Text>
                  </TouchableOpacity>
                )}

                {notification.actionRequired && notification.actionType === "respond" && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => handleAction(notification)}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#007AFF" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                      Respond
                    </Text>
                  </TouchableOpacity>
                )}

                {notification.actionRequired && notification.actionType === "review" && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.actionButtonTertiary]}
                    onPress={() => handleAction(notification)}
                  >
                    <Ionicons name="eye-outline" size={18} color="#FF9800" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextTertiary]}>
                      View Review
                    </Text>
                  </TouchableOpacity>
                )}

                {notification.actionRequired && notification.actionType === "view" && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => handleAction(notification)}
                  >
                    <Ionicons name="document-text-outline" size={18} color="#007AFF" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                      View Report
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteNotification(notification.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#999" />
              </TouchableOpacity>
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
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push("/owner/tenants")}
        >
          <Ionicons name="people-outline" size={20} color="#007AFF" />
          <Text style={styles.footerButtonText}>Tenants</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push("/owner/properties")}
        >
          <Ionicons name="home-outline" size={20} color="#007AFF" />
          <Text style={styles.footerButtonText}>Properties</Text>
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
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  actionBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  actionBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  markAllButton: {
    padding: 8,
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    gap: 4,
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
  notificationsList: {
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
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  notificationCardAction: {
    borderLeftColor: "#FF3B30",
    backgroundColor: "#FFF8F7",
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  actionFlag: {
    marginLeft: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  metadataContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  metadataTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  metadataText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  amountTag: {
    backgroundColor: "#E8F5E9",
  },
  amountText: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "700",
  },
  notificationTimestamp: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  actionButtonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  actionButtonTertiary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF9800",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonTextSecondary: {
    color: "#007AFF",
  },
  actionButtonTextTertiary: {
    color: "#FF9800",
  },
  deleteButton: {
    padding: 8,
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
  },
  footerButtonText: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "600",
  },
});

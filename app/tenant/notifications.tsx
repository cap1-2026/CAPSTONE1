import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type NotificationType = "all" | "booking" | "payment" | "contract" | "system" | "property" | "tenant";

interface Notification {
  id: string;
  type: Exclude<NotificationType, "all">;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRequired?: boolean;
  actionType?: "payment" | "approval" | "contract" | "review";
  bookingId?: string;
  propertyName?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationType>("all");

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "booking",
      title: "Booking Approved! 🎉",
      message: "Your booking request for Sunshine Apartments Unit 3A has been approved by the owner. You can now proceed to payment to secure your reservation.",
      timestamp: "2 hours ago",
      isRead: false,
      actionRequired: true,
      actionType: "payment",
      bookingId: "1",
      propertyName: "Sunshine Apartments Unit 3A"
    },
    {
      id: "2",
      type: "payment",
      title: "Payment Reminder",
      message: "Complete your payment within 48 hours to confirm your booking for Sunshine Apartments Unit 3A.",
      timestamp: "5 hours ago",
      isRead: false,
      actionRequired: true,
      actionType: "payment"
    },
    {
      id: "3",
      type: "booking",
      title: "Booking Request Submitted",
      message: "Your booking request for Modern Studio Downtown has been submitted and is pending owner approval.",
      timestamp: "1 day ago",
      isRead: true,
      actionRequired: false
    },
    {
      id: "4",
      type: "booking",
      title: "Booking Request Rejected",
      message: "Unfortunately, your booking request for Cozy 2BR Condo was not approved. The property may no longer be available.",
      timestamp: "3 days ago",
      isRead: true,
      actionRequired: false
    },
    {
      id: "5",
      type: "property",
      title: "New Property Match",
      message: "A new property matching your preferences has been listed: Luxe Studio in BGC (₱20,000/month).",
      timestamp: "1 week ago",
      isRead: true,
      actionRequired: false
    },
    {
      id: "6",
      type: "system",
      title: "Welcome to PadFinder!",
      message: "Thank you for registering as a tenant. Start browsing available properties and submit your booking requests.",
      timestamp: "2 weeks ago",
      isRead: true,
      actionRequired: false
    }
  ]);

  const filteredNotifications = notifications.filter(notif => {
    return filter === "all" || notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Exclude<NotificationType, "all">) => {
    switch (type) {
      case "booking": return "calendar";
      case "payment": return "card";
      case "contract": return "document-text";
      case "system": return "information-circle";
      case "property": return "home";
      case "tenant": return "people";
      default: return "notifications";
    }
  };

  const getNotificationColor = (type: Exclude<NotificationType, "all">) => {
    switch (type) {
      case "booking": return "#2196F3";
      case "payment": return "#4CAF50";
      case "contract": return "#FF9800";
      case "system": return "#9C27B0";
      case "property": return "#00BCD4";
      case "tenant": return "#FF5722";
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
      case "payment":
        router.push("/tenant/payment");
        break;
      case "approval":
        router.push("/tenant/approvals");
        break;
      case "contract":
        // Navigate to contracts page when implemented
        Alert.alert("Contracts", "Contract management coming soon!");
        break;
      case "review":
        router.push("/tenant/browse-properties");
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
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllButtonText}>Mark all read</Text>
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
          {(["all", "booking", "payment", "contract", "property", "system"] as NotificationType[]).map((f) => (
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
            // @ts-ignore - React key prop is valid but not in ViewProps type definition
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.notificationCardUnread
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
                  {!notification.isRead && (
                    <View style={styles.unreadDot} />
                  )}
                </View>

                <Text style={styles.notificationMessage}>{notification.message}</Text>

                {notification.propertyName && (
                  <View style={styles.propertyTag}>
                    <Ionicons name="home-outline" size={12} color="#666" />
                    <Text style={styles.propertyTagText}>{notification.propertyName}</Text>
                  </View>
                )}

                <Text style={styles.notificationTimestamp}>{notification.timestamp}</Text>

                {/* Action Buttons */}
                {notification.actionRequired && notification.actionType === "payment" && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleAction(notification)}
                  >
                    <Ionicons name="card-outline" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Proceed to Payment</Text>
                  </TouchableOpacity>
                )}

                {notification.actionRequired && notification.actionType === "approval" && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => handleAction(notification)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#007AFF" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                      View Approval Status
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
          onPress={() => router.push("/tenant/approvals")}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.footerButtonText}>View Approvals</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push("/tenant/browse-properties")}
        >
          <Ionicons name="search-outline" size={20} color="#007AFF" />
          <Text style={styles.footerButtonText}>Browse Properties</Text>
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
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
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
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllButtonText: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "600",
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  propertyTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
    gap: 4,
  },
  propertyTagText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
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
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonTextSecondary: {
    color: "#007AFF",
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
    gap: 12,
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
    fontSize: 14,
    fontWeight: "600",
  },
});

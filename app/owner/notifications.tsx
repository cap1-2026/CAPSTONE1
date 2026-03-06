import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Notification {
  id: string;
  type: "booking" | "payment" | "contract" | "system" | "tenant";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionRoute?: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

export default function OwnerNotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "booking" | "payment" | "contract" | "system">("all");
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "booking",
      title: "New Booking Request! 🎉",
      message: "Juan Dela Cruz has requested to book Sunshine Apartments Unit 3A. Move-in date: April 1, 2026 for 12 months. Review the application now.",
      timestamp: "1 hour ago",
      isRead: false,
      actionLabel: "Review Request",
      actionRoute: "/owner/bookings",
      icon: "calendar",
      iconColor: "#FF9800",
      iconBg: "#FFF3E0"
    },
    {
      id: "2",
      type: "booking",
      title: "New Booking Request",
      message: "Maria Santos wants to book Modern Studio Downtown starting March 15, 2026. Lease duration: 6 months. Check tenant details and decide.",
      timestamp: "3 hours ago",
      isRead: false,
      actionLabel: "Review Request",
      actionRoute: "/owner/bookings",
      icon: "calendar",
      iconColor: "#FF9800",
      iconBg: "#FFF3E0"
    },
    {
      id: "3",
      type: "payment",
      title: "Payment Received",
      message: "You've received ₱30,000 payment from Pedro Reyes for Cozy 2BR Condo (First month + security deposit). Funds are in escrow.",
      timestamp: "5 hours ago",
      isRead: false,
      icon: "cash",
      iconColor: "#4CAF50",
      iconBg: "#E8F5E9"
    },
    {
      id: "4",
      type: "contract",
      title: "Contract Signed",
      message: "Anna Garcia has signed the rental contract for Premium Loft BGC. The agreement is now active and legally binding.",
      timestamp: "1 day ago",
      isRead: true,
      icon: "document-text",
      iconColor: "#2196F3",
      iconBg: "#E3F2FD"
    },
    {
      id: "5",
      type: "booking",
      title: "Booking Request Expired",
      message: "A booking request from John Smith for Riverside Apartment has expired due to no response within 48 hours.",
      timestamp: "2 days ago",
      isRead: true,
      icon: "time-outline",
      iconColor: "#999",
      iconBg: "#f5f5f5"
    },
    {
      id: "6",
      type: "system",
      title: "Property Listing Approved",
      message: "Your property 'Garden View Townhouse' has been verified and is now live on the platform. Start receiving booking requests!",
      timestamp: "3 days ago",
      isRead: true,
      icon: "checkmark-circle",
      iconColor: "#4CAF50",
      iconBg: "#E8F5E9"
    },
    {
      id: "7",
      type: "tenant",
      title: "Tenant Inquiry",
      message: "Someone is interested in Downtown Loft and asked: 'Is parking available?' Click to respond.",
      timestamp: "4 days ago",
      isRead: true,
      actionLabel: "Respond",
      actionRoute: "/owner/properties",
      icon: "chatbubble-outline",
      iconColor: "#9C27B0",
      iconBg: "#F3E5F5"
    },
    {
      id: "8",
      type: "payment",
      title: "Monthly Rent Due Soon",
      message: "Rent payment of ₱25,000 is due in 3 days for Tenant: Lisa Wong at Makati Condo Unit 5B.",
      timestamp: "5 days ago",
      isRead: true,
      icon: "alert-circle-outline",
      iconColor: "#FF9800",
      iconBg: "#FFF3E0"
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    return filter === "all" || notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationAction = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionRoute) {
      router.push(notification.actionRoute as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
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
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
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
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { key: "all", label: "All", icon: "notifications" },
            { key: "booking", label: "Bookings", icon: "calendar" },
            { key: "payment", label: "Payments", icon: "cash" },
            { key: "contract", label: "Contracts", icon: "document-text" },
            { key: "system", label: "System", icon: "settings" }
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key as any)}
            >
              <Ionicons 
                name={f.icon as any} 
                size={16} 
                color={filter === f.key ? "#fff" : "#666"} 
              />
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
            </View>
            <Text style={styles.emptyStateTitle}>No Notifications</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! Check back later for updates.
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.notificationCardUnread
              ]}
              onPress={() => {
                if (!notification.isRead) {
                  markAsRead(notification.id);
                }
              }}
              activeOpacity={0.7}
            >
              {/* Unread Indicator */}
              {!notification.isRead && <View style={styles.unreadIndicator} />}

              <View style={styles.notificationContent}>
                {/* Icon */}
                <View style={[styles.notificationIcon, { backgroundColor: notification.iconBg }]}>
                  <Ionicons 
                    name={notification.icon as any} 
                    size={24} 
                    color={notification.iconColor} 
                  />
                </View>

                {/* Text Content */}
                <View style={styles.notificationText}>
                  <Text style={[
                    styles.notificationTitle,
                    !notification.isRead && styles.notificationTitleUnread
                  ]}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationMessage} numberOfLines={3}>
                    {notification.message}
                  </Text>
                  
                  {/* Timestamp */}
                  <Text style={styles.timestamp}>
                    <Ionicons name="time-outline" size={12} color="#999" /> {notification.timestamp}
                  </Text>

                  {/* Action Button */}
                  {notification.actionLabel && notification.actionRoute && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleNotificationAction(notification)}
                    >
                      <Text style={styles.actionButtonText}>{notification.actionLabel}</Text>
                      <Ionicons name="arrow-forward" size={14} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteNotification(notification.id)}
                >
                  <Ionicons name="close" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  unreadBadge: {
    backgroundColor: "#F44336",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  markAllButton: {
    padding: 8,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
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
  notificationsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  notificationCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationCardUnread: {
    backgroundColor: "#F0F8FF",
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  unreadIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
    zIndex: 1,
  },
  notificationContent: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: "700",
    color: "#000",
  },
  notificationMessage: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
  deleteButton: {
    padding: 4,
  },
});

// app/tenant/notifications.tsx — Live notifications via API
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

type NType = "all" | "booking" | "payment" | "contract" | "qr" | "property";

interface Notif {
  id: string;
  type: Exclude<NType, "all">;
  title: string;
  message: string;
  is_read: string | number | boolean;
  created_at: string;
  related_id?: number;
  action_type?: string;
}

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  booking:  { icon: "calendar",              color: "#2196F3", label: "Booking"  },
  payment:  { icon: "card",                  color: "#4CAF50", label: "Payment"  },
  contract: { icon: "document-text-outline", color: "#9C27B0", label: "Contract" },
  qr:       { icon: "qr-code",               color: "#FF9800", label: "QR Code"  },
  property: { icon: "home",                  color: "#607D8B", label: "Property" },
};

function timeAgo(dateStr: string) {
  const now  = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter]       = useState<NType>("all");
  const [userId, setUserId]       = useState<number | null>(null);
  const [items, setItems]         = useState<Notif[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load user ID
  useEffect(() => {
    UserStorage.getUser("tenant").then((u) => {
      if (u?.user_id) setUserId(Number(u.user_id));
    });
  }, []);

  const fetchNotifications = useCallback(async (uid?: number) => {
    const id = uid ?? userId;
    if (!id) { setLoading(false); return; }
    try {
      const res  = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}?user_id=${id}&role=tenant&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") {
        setItems(data.data ?? []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchNotifications(userId);
  }, [userId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => fetchNotifications(userId), 30000);
    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  async function markRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    try {
      await fetch(API_ENDPOINTS.NOTIFICATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id }),
      });
    } catch { /* silent */ }
  }

  async function markAllRead() {
    if (!userId) return;
    setItems(prev => prev.map(n => ({ ...n, is_read: 1 })));
    try {
      await fetch(API_ENDPOINTS.NOTIFICATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read", user_id: userId, user_role: "tenant" }),
      });
    } catch { /* silent */ }
  }

  async function deleteNotif(id: string) {
    Alert.alert("Delete Notification", "Remove this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setItems(prev => prev.filter(n => n.id !== id));
          try {
            await fetch(API_ENDPOINTS.NOTIFICATIONS, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "delete", id }),
            });
          } catch { /* silent */ }
        },
      },
    ]);
  }

  function handleAction(n: Notif) {
    markRead(n.id);
    switch (n.action_type) {
      case "payment":  router.push("/tenant/payment");  break;
      case "approval": router.push("/tenant/approvals"); break;
      case "contract": router.push("/tenant/approvals"); break;
      case "qr":       router.push("/tenant/payment-qr"); break;
      default:         router.push("/tenant/approvals"); break;
    }
  }

  const filtered = filter === "all" ? items : items.filter(n => n.type === filter);
  const unread   = items.filter(n => !n.is_read || n.is_read === "0").length;

  const TABS: { key: NType; label: string }[] = [
    { key: "all",      label: "All"      },
    { key: "booking",  label: "Booking"  },
    { key: "payment",  label: "Payment"  },
    { key: "contract", label: "Contract" },
    { key: "qr",       label: "QR Code"  },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unread > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{unread} new</Text></View>
          )}
        </View>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllTxt}>Mark all read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.refreshBtn} onPress={() => { setRefreshing(true); fetchNotifications(); }}>
          <Ionicons name="refresh-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {TABS.map(({ key, label }) => {
            const count = key === "all" ? items.length : items.filter(n => n.type === key).length;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, filter === key && styles.chipActive]}
                onPress={() => setFilter(key)}
              >
                <Text style={[styles.chipTxt, filter === key && styles.chipTxtActive]}>
                  {label}{count > 0 ? ` (${count})` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingTxt}>Loading notifications…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} colors={["#007AFF"]} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTxt}>No notifications</Text>
              <Text style={styles.emptySub}>{filter === "all" ? "You're all caught up!" : `No ${filter} notifications yet`}</Text>
            </View>
          ) : (
            filtered.map((n) => {
              const meta     = TYPE_META[n.type] ?? TYPE_META.booking;
              const isUnread = !n.is_read || n.is_read === "0" || n.is_read === 0;
              const hasAction= !!n.action_type;
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.card, isUnread && styles.cardUnread]}
                  onPress={() => markRead(n.id)}
                  activeOpacity={0.8}
                >
                  {/* Icon */}
                  <View style={[styles.iconWrap, { backgroundColor: meta.color }]}>
                    <Ionicons name={meta.icon} size={22} color="#fff" />
                  </View>

                  {/* Content */}
                  <View style={styles.content}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title} numberOfLines={2}>{n.title}</Text>
                      {isUnread && <View style={styles.dot} />}
                    </View>
                    <Text style={styles.msg}>{n.message}</Text>

                    {/* Type badge */}
                    <View style={styles.metaRow}>
                      <View style={[styles.typeBadge, { backgroundColor: meta.color + "20" }]}>
                        <Text style={[styles.typeBadgeTxt, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                      <Text style={styles.time}>{timeAgo(n.created_at)}</Text>
                    </View>

                    {/* Action button */}
                    {hasAction && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction(n)}>
                        <Ionicons name={
                          n.action_type === "payment"  ? "card-outline"            :
                          n.action_type === "contract" ? "document-text-outline"   :
                          n.action_type === "qr"       ? "qr-code-outline"         :
                          "checkmark-circle-outline"
                        } size={16} color="#fff" />
                        <Text style={styles.actionBtnTxt}>{
                          n.action_type === "payment"  ? "Proceed to Payment"      :
                          n.action_type === "contract" ? "View Contract"           :
                          n.action_type === "qr"       ? "View QR Code"            :
                          "View Status"
                        }</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Delete */}
                  <TouchableOpacity style={styles.delBtn} onPress={() => deleteNotif(n.id)}>
                    <Ionicons name="trash-outline" size={18} color="#bbb" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={() => router.push("/tenant/approvals")}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.footerBtnTxt}>View Approvals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={() => router.push("/tenant/browse-properties")}>
          <Ionicons name="search-outline" size={20} color="#007AFF" />
          <Text style={styles.footerBtnTxt}>Browse Properties</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#F5F5F5" },
  header:       { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E0E0E0", gap: 8 },
  headerLeft:   { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:  { fontSize: 22, fontWeight: "700", color: "#333" },
  badge:        { backgroundColor: "#FF3B30", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText:    { color: "#fff", fontSize: 11, fontWeight: "700" },
  markAllTxt:   { color: "#007AFF", fontSize: 13, fontWeight: "600" },
  refreshBtn:   { padding: 6 },
  filterWrap:   { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E0E0E0" },
  filterRow:    { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F0F0F0" },
  chipActive:   { backgroundColor: "#007AFF" },
  chipTxt:      { fontSize: 13, fontWeight: "600", color: "#666" },
  chipTxtActive:{ color: "#fff" },
  list:         { flex: 1, padding: 14 },
  center:       { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  loadingTxt:   { color: "#666", fontSize: 14 },
  empty:        { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTxt:     { fontSize: 18, fontWeight: "600", color: "#999", marginTop: 12 },
  emptySub:     { fontSize: 14, color: "#bbb" },
  card:         { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, flexDirection: "row", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, gap: 12 },
  cardUnread:   { borderLeftWidth: 4, borderLeftColor: "#007AFF" },
  iconWrap:     { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  content:      { flex: 1 },
  titleRow:     { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 },
  title:        { flex: 1, fontSize: 15, fontWeight: "700", color: "#222", lineHeight: 20 },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30", marginTop: 4, marginLeft: 6 },
  msg:          { fontSize: 13, color: "#555", lineHeight: 19, marginBottom: 8 },
  metaRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  typeBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeTxt: { fontSize: 11, fontWeight: "700" },
  time:         { fontSize: 11, color: "#999" },
  actionBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#007AFF", paddingVertical: 9, paddingHorizontal: 14, borderRadius: 8, marginTop: 2 },
  actionBtnTxt: { color: "#fff", fontSize: 13, fontWeight: "600" },
  delBtn:       { padding: 6, alignSelf: "flex-start" },
  footer:       { backgroundColor: "#fff", flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#E0E0E0", gap: 12 },
  footerBtn:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F0F0F0", paddingVertical: 12, borderRadius: 8, gap: 6 },
  footerBtnTxt: { color: "#007AFF", fontSize: 14, fontWeight: "600" },
});

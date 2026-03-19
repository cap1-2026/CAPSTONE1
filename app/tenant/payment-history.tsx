import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

interface Payment {
  id: number;
  booking_id: number;
  property_name: string;
  amount: number;
  method: string;
  transaction_id: string;
  status: string;
  created_at: string;
}

function getMethodIcon(method: string): { name: string; color: string; bg: string } {
  if (method === "gcash")          return { name: "phone-portrait",  color: "#2563EB", bg: "#EFF6FF" };
  if (method === "card")           return { name: "card",            color: "#7C3AED", bg: "#F5F3FF" };
  if (method === "bank_transfer")  return { name: "business",        color: "#0891B2", bg: "#ECFEFF" };
  if (method?.includes("bypass") || method === "paymongo")
                                   return { name: "shield-checkmark",color: "#059669", bg: "#F0FDF4" };
  return                                  { name: "cash",            color: "#059669", bg: "#F0FDF4" };
}

function getMethodLabel(method: string): string {
  if (method === "gcash")          return "GCash";
  if (method === "card")           return "Credit / Debit Card";
  if (method === "bank_transfer")  return "Bank Transfer";
  if (method?.includes("bypass") || method === "paymongo") return "PayMongo";
  return "Cash";
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_PAYMENTS}?tenant_id=${userId}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") setPayments(data.data ?? []);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    UserStorage.getUser("tenant").then((user) => {
      if (user) fetchPayments(user.user_id);
      else setLoading(false);
    });
  }, [fetchPayments]);

  function onRefresh() {
    setRefreshing(true);
    UserStorage.getUser("tenant").then((u) => { if (u) fetchPayments(u.user_id); });
  }

  const paidPayments   = payments.filter((p) => p.status === "paid");
  const totalPaid      = paidPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const pendingCount   = payments.filter((p) => p.status !== "paid").length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Payment History</Text>
          <Text style={styles.headerSub}>{payments.length} transaction{payments.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            payments.length > 0 ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>₱{totalPaid.toLocaleString()}</Text>
                  <Text style={styles.summaryLabel}>Total Paid</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: "#059669" }]}>{paidPayments.length}</Text>
                  <Text style={styles.summaryLabel}>Completed</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: "#D97706" }]}>{pendingCount}</Text>
                  <Text style={styles.summaryLabel}>Pending</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>Your payment history will appear here after you complete a payment.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mi     = getMethodIcon(item.method);
            const isPaid = item.status === "paid";
            const dt     = new Date(item.created_at);
            const dateStr = isNaN(dt.getTime())
              ? item.created_at
              : dt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
            const timeStr = isNaN(dt.getTime()) ? "" : dt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
            return (
              <View style={styles.card}>
                <View style={[styles.cardIcon, { backgroundColor: mi.bg }]}>
                  <Ionicons name={mi.name as any} size={22} color={mi.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardProp} numberOfLines={1}>{item.property_name}</Text>
                    <Text style={[styles.cardAmt, { color: isPaid ? "#059669" : "#D97706" }]}>
                      ₱{Number(item.amount).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.cardMidRow}>
                    <View style={[styles.methodBadge, { backgroundColor: mi.bg }]}>
                      <Text style={[styles.methodText, { color: mi.color }]}>{getMethodLabel(item.method)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isPaid ? "#D1FAE5" : "#FEF3C7" }]}>
                      <Text style={[styles.statusText, { color: isPaid ? "#059669" : "#D97706" }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardMetaRow}>
                    <Ionicons name="receipt-outline" size={10} color="#94A3B8" />
                    <Text style={styles.cardMeta} numberOfLines={1}>TXN: {item.transaction_id}</Text>
                  </View>
                  <View style={styles.cardMetaRow}>
                    <Ionicons name="time-outline" size={10} color="#94A3B8" />
                    <Text style={styles.cardMeta}>{dateStr}{timeStr ? `  ·  ${timeStr}` : ""}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#F8FAFC" },
  header:      { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  backBtn:     { marginRight: 10, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerSub:   { fontSize: 12, color: "#64748B", marginTop: 1 },
  refreshBtn:  { width: 34, height: 34, borderRadius: 8, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  center:      { alignItems: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
  listContent: { padding: 14, paddingBottom: 32 },

  summaryCard:    { flexDirection: "row", backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryItem:    { flex: 1, alignItems: "center" },
  summaryValue:   { fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 2 },
  summaryLabel:   { fontSize: 11, color: "#64748B", fontWeight: "500" },
  summaryDivider: { width: 1, backgroundColor: "#E2E8F0", marginVertical: 4 },

  empty:      { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#94A3B8" },
  emptySub:   { fontSize: 13, color: "#CBD5E1", textAlign: "center", paddingHorizontal: 30 },

  card:          { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardIcon:      { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTopRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardProp:      { fontSize: 14, fontWeight: "700", color: "#0F172A", flex: 1, marginRight: 8 },
  cardAmt:       { fontSize: 16, fontWeight: "800" },
  cardMidRow:    { flexDirection: "row", gap: 8, marginBottom: 6 },
  methodBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  methodText:    { fontSize: 11, fontWeight: "600" },
  statusBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText:    { fontSize: 10, fontWeight: "700" },
  cardMetaRow:   { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  cardMeta:      { fontSize: 11, color: "#94A3B8", flex: 1 },
});

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  method: string;
  transaction_id: string;
  status: string;
  created_at: string;
  property_name: string;
  tenant_name: string;
}

export default function Financials() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<number | null>(null);

  const fetchPayments = useCallback(async (id: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_PAYMENTS}?owner_id=${id}`);
      const data = await res.json();
      if (data.status === "success") setPayments(data.data);
    } catch {
      Alert.alert("Error", "Could not load payment data. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    UserStorage.getUser().then((user) => {
      if (user) { setOwnerId(user.user_id); fetchPayments(user.user_id); }
      else setLoading(false);
    });
  }, [fetchPayments]);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidCount = payments.filter((p) => p.status === "paid").length;

  const getMethodIcon = (method: string): any => {
    if (method === "gcash") return "phone-portrait";
    if (method === "card") return "card";
    if (method === "bank_transfer") return "business";
    return "cash";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financials</Text>
        <TouchableOpacity
          onPress={() => { if (ownerId) { setLoading(true); fetchPayments(ownerId); } }}
        >
          <Ionicons name="refresh-outline" size={24} color="#1565D8" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1565D8" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: "#1565D8" }]}>
              <Ionicons name="cash" size={28} color="#fff" />
              <Text style={styles.summaryAmount}>₱{totalRevenue.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Total Revenue</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: "#4CAF50" }]}>
              <Ionicons name="checkmark-circle" size={28} color="#fff" />
              <Text style={styles.summaryAmount}>{paidCount}</Text>
              <Text style={styles.summaryLabel}>Payments Received</Text>
            </View>
          </View>

          {/* Payment List */}
          <Text style={styles.sectionTitle}>Payment History</Text>

          {payments.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="wallet-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No payments yet</Text>
            </View>
          ) : (
            <FlatList
              data={payments}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <View style={styles.paymentCard}>
                  <View style={styles.paymentRow}>
                    <View style={styles.methodIcon}>
                      <Ionicons name={getMethodIcon(item.method)} size={22} color="#1565D8" />
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.propertyName}>{item.property_name}</Text>
                      <Text style={styles.tenantName}>{item.tenant_name}</Text>
                      <Text style={styles.txnId}>TXN: {item.transaction_id}</Text>
                      <Text style={styles.paymentDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.amountCol}>
                      <Text style={styles.amount}>₱{Number(item.amount).toLocaleString()}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: item.status === "paid" ? "#4CAF50" : "#FF9800" }]}>
                        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  loadingText: { marginTop: 12, color: "#666" },
  summaryRow: { flexDirection: "row", gap: 12, padding: 16 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: "center", gap: 6, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  summaryAmount: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  summaryLabel: { fontSize: 12, color: "rgba(255,255,255,0.85)", textAlign: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#333", paddingHorizontal: 16, marginBottom: 8 },
  emptyText: { fontSize: 16, color: "#999", marginTop: 16 },
  paymentCard: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  paymentRow: { flexDirection: "row", alignItems: "center" },
  methodIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center", marginRight: 12 },
  paymentInfo: { flex: 1 },
  propertyName: { fontSize: 14, fontWeight: "600", color: "#333" },
  tenantName: { fontSize: 12, color: "#666", marginTop: 2 },
  txnId: { fontSize: 11, color: "#999", marginTop: 2 },
  paymentDate: { fontSize: 11, color: "#999" },
  amountCol: { alignItems: "flex-end", gap: 6 },
  amount: { fontSize: 16, fontWeight: "bold", color: "#1565D8" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "bold", color: "#fff" },
});

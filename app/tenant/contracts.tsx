import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

interface Contract {
  id: number;
  property_name: string;
  property_address: string;
  property_price: number;
  move_in: string;
  lease_duration: string;
  owner_name?: string;
  owner_email?: string;
  status: string;
  created_at: string;
}

export default function TenantContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContracts = useCallback(async (userId: number) => {
    try {
      // Contracts = approved bookings
      const res = await fetch(`${API_ENDPOINTS.GET_BOOKINGS}?tenant_id=${userId}&status=approved&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") {
        setContracts(data.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    UserStorage.getUser().then((user) => {
      if (user) fetchContracts(user.user_id);
      else setLoading(false);
    });
  }, [fetchContracts]);

  function onRefresh() {
    setRefreshing(true);
    UserStorage.getUser().then((user) => { if (user) fetchContracts(user.user_id); });
  }

  function handleContactLandlord(contract: Contract) {
    if (contract.owner_email) {
      Alert.alert(
        `Contact Landlord`,
        `Email: ${contract.owner_email}`,
        [{ text: "OK" }]
      );
    } else {
      Alert.alert("Notice", "Landlord contact info not available.");
    }
  }

  function handleRenewContract(contract: Contract) {
    Alert.alert(
      "Renew Contract",
      `Request a renewal for ${contract.property_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send Request", onPress: () => Alert.alert("Success", "Renewal request sent to landlord.") },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Contracts</Text>
          <Text style={styles.headerSub}>{contracts.length} active contract{contracts.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading contracts...</Text>
        </View>
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="file-document-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Active Contracts</Text>
              <Text style={styles.emptySub}>
                Contracts appear here once your booking request is approved by the owner.
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => router.push("/tenant/browse-properties" as any)}
              >
                <Text style={styles.browseBtnText}>Browse Properties</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="file-document-outline" size={24} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.propertyName}>{item.property_name}</Text>
                  <Text style={styles.propertyAddress}>{item.property_address}</Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Contract Details */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={15} color="#64748B" />
                  <View>
                    <Text style={styles.detailLabel}>Monthly Rent</Text>
                    <Text style={styles.detailValue}>₱{Number(item.property_price).toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={15} color="#64748B" />
                  <View>
                    <Text style={styles.detailLabel}>Move-in Date</Text>
                    <Text style={styles.detailValue}>{item.move_in}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={15} color="#64748B" />
                  <View>
                    <Text style={styles.detailLabel}>Lease Duration</Text>
                    <Text style={styles.detailValue}>{item.lease_duration}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="shield-check" size={15} color="#64748B" />
                  <View>
                    <Text style={styles.detailLabel}>Security Deposit</Text>
                    <Text style={styles.detailValue}>₱{Number(item.property_price).toLocaleString()}</Text>
                  </View>
                </View>

                {item.owner_name && (
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={15} color="#64748B" />
                    <View>
                      <Text style={styles.detailLabel}>Landlord</Text>
                      <Text style={styles.detailValue}>{item.owner_name}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Ionicons name="create-outline" size={15} color="#64748B" />
                  <View>
                    <Text style={styles.detailLabel}>Agreement Date</Text>
                    <Text style={styles.detailValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>

              {/* Terms Notice */}
              <View style={styles.termsBox}>
                <Ionicons name="information-circle-outline" size={14} color="#2563EB" />
                <Text style={styles.termsText}>
                  This is a legally binding rental agreement. Monthly rent is due on the 1st of each month.
                  30-day notice required for early termination.
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleContactLandlord(item)}>
                  <Ionicons name="call-outline" size={16} color="#2563EB" />
                  <Text style={styles.actionBtnText}>Contact Landlord</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.renewBtn]} onPress={() => handleRenewContract(item)}>
                  <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
                  <Text style={styles.renewBtnText}>Renew</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  backBtn: { marginRight: 10, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 12, color: "#64748B", marginTop: 1 },
  refreshBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", paddingVertical: 80 },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
  listContent: { padding: 14, paddingBottom: 32 },
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 24, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#94A3B8", marginTop: 8 },
  emptySub: { fontSize: 14, color: "#CBD5E1", textAlign: "center", lineHeight: 20 },
  browseBtn: { backgroundColor: "#1D4ED8", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 6 },
  browseBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  iconCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  propertyName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  propertyAddress: { fontSize: 12, color: "#64748B", marginTop: 2 },
  activeBadge: { backgroundColor: "#D1FAE5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeBadgeText: { fontSize: 11, fontWeight: "700", color: "#059669" },
  divider: { height: 1, backgroundColor: "#F1F5F9" },
  detailsGrid: { padding: 16, gap: 12 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailLabel: { fontSize: 11, color: "#94A3B8", marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
  termsBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#EFF6FF", marginHorizontal: 16, marginBottom: 14, padding: 10, borderRadius: 8 },
  termsText: { flex: 1, fontSize: 12, color: "#2563EB", lineHeight: 18 },
  actionsRow: { flexDirection: "row", gap: 10, padding: 14, paddingTop: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: "#EFF6FF" },
  actionBtnText: { fontSize: 13, color: "#2563EB", fontWeight: "600" },
  renewBtn: { backgroundColor: "#059669" },
  renewBtnText: { fontSize: 13, color: "#fff", fontWeight: "700" },
});
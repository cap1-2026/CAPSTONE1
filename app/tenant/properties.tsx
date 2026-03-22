import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

interface Booking {
  id: number;
  property_name: string;
  property_address: string;
  property_price: number;
  move_in: string;
  lease_duration: string;
  status: "pending" | "approved" | "rejected";
  contract_status?: "none" | "submitted" | "approved" | "rejected";
  payment_status?: "none" | "pending_owner_approval" | "approved" | "rejected";
  property_deposit: number;
  created_at: string;
  owner_id?: number;
  owner_name?: string;
}

export default function TenantPropertiesPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
  const [detailsModal, setDetailsModal] = useState<Booking | null>(null);
  const [renewModal, setRenewModal] = useState<Booking | null>(null);
  const [renewMonths, setRenewMonths] = useState(3);
  const [renewing, setRenewing] = useState(false);

  const fetchBookings = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_BOOKINGS}?tenant_id=${userId}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") setBookings(data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    UserStorage.getUser("tenant").then((user) => {
      if (user) fetchBookings(user.user_id);
      else setLoading(false);
    });
  }, [fetchBookings]);

  function onRefresh() {
    setRefreshing(true);
    UserStorage.getUser("tenant").then((user) => { if (user) fetchBookings(user.user_id); });
  }

  const QR_READY_STATUSES = ["pending_owner_approval", "approved"] as const;
  const filtered = bookings.filter((b) =>
    b.status === "approved" &&
    QR_READY_STATUSES.includes(b.payment_status as any)
  );

  async function renewLease(booking: Booking) {
    setRenewing(true);
    try {
      const res = await fetch(API_ENDPOINTS.RENEW_LEASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: booking.id, extension_months: renewMonths }),
      });
      const data = await res.json();
      if (data.status === "success") {
        Alert.alert("Lease Renewed!", `Your lease has been extended by ${renewMonths} month${renewMonths > 1 ? "s" : ""}. New duration: ${data.new_duration}`);
        setRenewModal(null);
        UserStorage.getUser("tenant").then((u) => { if (u) fetchBookings(u.user_id); });
      } else {
        Alert.alert("Renewal Failed", data.message || "Could not renew lease. Please try again.");
      }
    } catch {
      Alert.alert("Connection Error", "Unable to connect. Please check your internet and try again.");
    } finally {
      setRenewing(false);
    }
  }

  const getStatusColor = (status: string) => {
    if (status === "approved") return "#059669";
    if (status === "pending") return "#D97706";
    return "#DC2626";
  };

  const getStatusBg = (status: string) => {
    if (status === "approved") return "#D1FAE5";
    if (status === "pending") return "#FEF3C7";
    return "#FEE2E2";
  };

  const getStatusIcon = (status: string): any => {
    if (status === "approved") return "checkmark-circle";
    if (status === "pending") return "time";
    return "close-circle";
  };

  // Get process step status (done, active, locked)
  function getProcessStepStatus(booking: Booking, stepType: "booking" | "contract" | "payment" | "qr"): "done" | "active" | "locked" {
    if (stepType === "booking") {
      if (booking.status === "approved") return "done";
      if (booking.status === "pending") return "active";
      return "locked";
    }
    if (stepType === "contract") {
      if (booking.status !== "approved") return "locked";
      const cs = booking.contract_status ?? "none";
      if (cs === "approved") return "done";
      if (cs === "none" || cs === "submitted") return "active";
      return "locked";
    }
    if (stepType === "payment") {
      if ((booking.contract_status ?? "none") !== "approved") return "locked";
      const ps = booking.payment_status ?? "none";
      if (ps === "approved") return "done";
      if (ps === "none" || ps === "pending_owner_approval") return "active";
      return "locked";
    }
    if (stepType === "qr") {
      if (QR_READY_STATUSES.includes((booking.payment_status ?? "none") as any)) return "done";
      return "locked";
    }
    return "locked";
  }

  function getStepLabel(booking: Booking, stepType: "booking" | "contract" | "payment" | "qr"): string {
    if (stepType === "booking") {
      if (booking.status === "approved") return "Approved";
      if (booking.status === "pending") return "Pending";
      return "Rejected";
    }
    if (stepType === "contract") {
      const cs = booking.contract_status ?? "none";
      if (cs === "approved") return "Signed";
      if (cs === "submitted") return "Review";
      return "Pending";
    }
    if (stepType === "payment") {
      const ps = booking.payment_status ?? "none";
      if (ps === "approved") return "Paid";
      if (ps === "pending_owner_approval") return "Review";
      return "Pending";
    }
    if (stepType === "qr") {
      if (QR_READY_STATUSES.includes((booking.payment_status ?? "none") as any)) return "Ready";
      return "Locked";
    }
    return "—";
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Properties</Text>
          <Text style={styles.headerSub}>{filtered.length} active rental{filtered.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading your properties...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="home-city-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No active rentals</Text>
              <Text style={styles.emptySub}>Complete the booking process to see your rentals here.</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/tenant/browse-properties" as any)}>
                <Text style={styles.browseBtnText}>Browse Properties</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Status Header */}
              <View style={[styles.statusBar, { backgroundColor: getStatusBg(item.status) }]}>
                <Ionicons name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status.toUpperCase()}
                </Text>
                <Text style={styles.submittedDate}>
                  Booked {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.cardBody}>
                {/* Property Info */}
                <Text style={styles.propertyName}>{item.property_name}</Text>

                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={14} color="#64748B" />
                  <Text style={styles.infoText}>{item.property_address}</Text>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Monthly Rent</Text>
                    <Text style={styles.detailValue}>₱{Number(item.property_price).toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Move-in Date</Text>
                    <Text style={styles.detailValue}>{item.move_in}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{item.lease_duration}</Text>
                  </View>
                </View>

                {/* Process Journey */}
                <TouchableOpacity
                  style={styles.journeyHeader}
                  onPress={() => setExpandedBookingId(expandedBookingId === item.id ? null : item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.journeyTitleRow}>
                    <Ionicons name="map-marker-path" size={15} color="#2563EB" />
                    <Text style={styles.journeyTitle}>Process Status</Text>
                  </View>
                  <Ionicons
                    name={expandedBookingId === item.id ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#2563EB"
                  />
                </TouchableOpacity>

                {expandedBookingId === item.id && (
                  <View style={styles.journeyContainer}>
                    {(["booking", "contract", "payment", "qr"] as const).map((step, idx) => {
                      const status = getProcessStepStatus(item, step);
                      const stepIcons = {
                        booking: "home-outline",
                        contract: "document-text-outline",
                        payment: "card-outline",
                        qr: "qrcode"
                      };
                      const stepColors = {
                        done: { bg: "#D1FAE5", border: "#059669", text: "#059669", icon: "#059669" },
                        active: { bg: "#EFF6FF", border: "#2563EB", text: "#2563EB", icon: "#2563EB" },
                        locked: { bg: "#F1F5F9", border: "#CBD5E1", text: "#94A3B8", icon: "#CBD5E1" }
                      };
                      const colors = stepColors[status];
                      const label = getStepLabel(item, step);

                      return (
                        <View key={step}>
                          <View style={styles.journeyStep}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 2 }]}>
                              <Text style={[styles.stepNumberText, { color: colors.text }]}>{idx + 1}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={[styles.stepLabelMain, { color: colors.text }]}>
                                {step.charAt(0).toUpperCase() + step.slice(1)}
                              </Text>
                              <Text style={[styles.stepStatus, { color: colors.icon }]}>{label}</Text>
                            </View>
                            <Ionicons
                              name={status === "done" ? "checkmark-circle" : status === "active" ? "arrow-forward-circle" : "lock-closed"}
                              size={20}
                              color={colors.icon}
                            />
                          </View>
                          {idx < 3 && <View style={[styles.stepLine, { backgroundColor: colors.border }]} />}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* View Details Button */}
                <TouchableOpacity
                  style={styles.viewDetailsBtn}
                  onPress={() => setDetailsModal(item)}
                >
                  <Ionicons name="information-circle" size={16} color="#2563EB" />
                  <Text style={styles.viewDetailsBtnText}>View Details & QR Code</Text>
                </TouchableOpacity>

                {/* Show completed status for approved bookings with payment done */}
                {item.status === "approved" && QR_READY_STATUSES.includes(item.payment_status as any) && (
                  <View>
                    <View style={styles.completedInfo}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.completedInfoText}>Booking confirmed - Ready to move in!</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.renewBtn}
                        onPress={() => { setRenewMonths(3); setRenewModal(item); }}
                      >
                        <Ionicons name="refresh-circle-outline" size={17} color="#fff" />
                        <Text style={styles.renewBtnText}>Renew Lease</Text>
                      </TouchableOpacity>
                      {item.owner_id && (
                        <TouchableOpacity
                          style={styles.messageBtn}
                          onPress={() => router.push({
                            pathname: "/tenant/messages",
                            params: {
                              booking_id:    String(item.id),
                              owner_id:      String(item.owner_id),
                              owner_name:    item.owner_name || "Property Owner",
                              property_name: item.property_name,
                            },
                          } as any)}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={17} color="#7C3AED" />
                          <Text style={styles.messageBtnText}>Message Owner</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* Details Modal */}
      {detailsModal && (
        <Modal visible animationType="slide" onRequestClose={() => setDetailsModal(null)}>
          <SafeAreaView style={styles.detailsModalContainer}>
            {/* Header */}
            <View style={styles.detailsHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailsTitle}>{detailsModal.property_name}</Text>
                <Text style={styles.detailsAddress}>{detailsModal.property_address}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailsModal(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false}>
              {/* Property Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Property Details</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsItemLabel}>Monthly Rent</Text>
                    <Text style={styles.detailsItemValue}>₱{Number(detailsModal.property_price).toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsItemLabel}>Move-in</Text>
                    <Text style={styles.detailsItemValue}>{detailsModal.move_in}</Text>
                  </View>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsItemLabel}>Duration</Text>
                    <Text style={styles.detailsItemValue}>{detailsModal.lease_duration}</Text>
                  </View>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsItemLabel}>Deposit</Text>
                    <Text style={styles.detailsItemValue}>₱{Number(detailsModal.property_deposit).toLocaleString()}</Text>
                  </View>
                </View>
              </View>

              {/* Process Journey */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Booking Process</Text>
                <View style={styles.processSteps}>
                  {(["booking", "contract", "payment", "qr"] as const).map((step, idx) => {
                    const status = getProcessStepStatus(detailsModal, step);
                    const label = getStepLabel(detailsModal, step);
                    const stepColors = {
                      done: { bg: "#D1FAE5", border: "#059669", text: "#059669", icon: "#059669" },
                      active: { bg: "#EFF6FF", border: "#2563EB", text: "#2563EB", icon: "#2563EB" },
                      locked: { bg: "#F1F5F9", border: "#CBD5E1", text: "#94A3B8", icon: "#CBD5E1" }
                    };
                    const colors = stepColors[status];
                    const stepNames = { booking: "Booking", contract: "Contract", payment: "Payment", qr: "QR Code" };

                    return (
                      <View key={step} style={styles.processStep}>
                        <View style={[styles.processStepCircle, { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 2 }]}>
                          <Text style={[styles.processStepNumber, { color: colors.text }]}>{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.processStepName, { color: colors.text }]}>{stepNames[step]}</Text>
                          <Text style={[styles.processStepStatus, { color: colors.icon }]}>{label}</Text>
                        </View>
                        <Ionicons
                          name={status === "done" ? "checkmark-circle" : status === "active" ? "arrow-forward-circle" : "lock-closed"}
                          size={24}
                          color={colors.icon}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* QR Code Section */}
              {QR_READY_STATUSES.includes(detailsModal.payment_status as any) && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Access QR Code</Text>
                  <View style={styles.qrCodeBox}>
                    <View style={styles.qrPlaceholder}>
                      <Ionicons name="qrcode" size={80} color="#2563EB" />
                    </View>
                    <Text style={styles.qrText}>QR code is ready for access</Text>
                    <Text style={styles.qrSubText}>Use this QR code for entry to the property</Text>
                    <TouchableOpacity style={styles.generateQrBtn}>
                      <Ionicons name="download-outline" size={18} color="#fff" />
                      <Text style={styles.generateQrBtnText}>Download QR Code</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Status Info */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Status Summary</Text>
                <View style={[styles.statusSummary, {
                  backgroundColor: detailsModal.status === "approved" && QR_READY_STATUSES.includes(detailsModal.payment_status as any) ? "#D1FAE5" : "#FEF3C7"
                }]}>
                  <Ionicons
                    name={detailsModal.status === "approved" && QR_READY_STATUSES.includes(detailsModal.payment_status as any) ? "checkmark-circle" : "time"}
                    size={20}
                    color={detailsModal.status === "approved" && QR_READY_STATUSES.includes(detailsModal.payment_status as any) ? "#059669" : "#D97706"}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.statusSummaryTitle, {
                      color: detailsModal.status === "approved" && QR_READY_STATUSES.includes(detailsModal.payment_status as any) ? "#059669" : "#D97706"
                    }]}>
                      {detailsModal.status === "approved" && QR_READY_STATUSES.includes(detailsModal.payment_status as any)
                        ? "✓ All Complete"
                        : "In Progress"}
                    </Text>
                    <Text style={styles.statusSummaryText}>
                      {detailsModal.status === "pending"
                        ? "Waiting for owner approval"
                        : detailsModal.contract_status === "none"
                        ? "Sign contract to proceed"
                        : detailsModal.contract_status === "submitted"
                        ? "Contract under review"
                        : detailsModal.payment_status === "none"
                        ? "Complete payment"
                        : detailsModal.payment_status === "pending_owner_approval"
                        ? "Payment under review"
                        : "Ready to move in!"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.detailsActions}>
              {detailsModal.status === "approved" && !QR_READY_STATUSES.includes(detailsModal.payment_status as any) && (
                <TouchableOpacity
                  style={styles.detailsPayBtn}
                  onPress={() => {
                    setDetailsModal(null);
                    router.push({
                      pathname: "/tenant/payment",
                      params: {
                        booking_id: String(detailsModal.id),
                        amount: String(Number(detailsModal.property_deposit) || Number(detailsModal.property_price)),
                        property_name: detailsModal.property_name,
                        property_address: detailsModal.property_address,
                        monthly_rent: String(detailsModal.property_price),
                      },
                    } as any);
                  }}
                >
                  <Ionicons name="card-outline" size={18} color="#fff" />
                  <Text style={styles.detailsPayBtnText}>Proceed to Payment</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.detailsCloseBtn}
                onPress={() => setDetailsModal(null)}
              >
                <Text style={styles.detailsCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {/* Renew Lease Modal */}
      {renewModal && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setRenewModal(null)}>
          <View style={styles.renewOverlay}>
            <View style={styles.renewSheet}>
              <Text style={styles.renewTitle}>Renew Lease</Text>
              <Text style={styles.renewProp} numberOfLines={2}>{renewModal.property_name}</Text>
              <Text style={styles.renewLabel}>Current Duration: {renewModal.lease_duration}</Text>
              <Text style={[styles.renewLabel, { marginTop: 14, marginBottom: 8, fontWeight: "700", color: "#0F172A" }]}>Extend by:</Text>
              {[3, 6, 12].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.renewOption, renewMonths === m && styles.renewOptionActive]}
                  onPress={() => setRenewMonths(m)}
                >
                  <Text style={[styles.renewOptionText, renewMonths === m && styles.renewOptionTextActive]}>
                    {m} month{m > 1 ? "s" : ""}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.renewConfirmBtn}
                onPress={() => renewLease(renewModal)}
                disabled={renewing}
              >
                {renewing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.renewConfirmText}>Confirm Renewal</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.renewCancelBtn} onPress={() => setRenewModal(null)}>
                <Text style={styles.renewCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#94A3B8" },
  browseBtn: { backgroundColor: "#1D4ED8", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  browseBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 14, marginBottom: 14, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statusBar: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, paddingHorizontal: 14 },
  statusText: { fontSize: 12, fontWeight: "700", flex: 1 },
  submittedDate: { fontSize: 11, color: "#94A3B8" },
  cardBody: { padding: 14 },
  propertyName: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  infoText: { fontSize: 13, color: "#64748B", flex: 1 },
  detailsRow: { flexDirection: "row", gap: 8, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 10, marginBottom: 12 },
  detailItem: { flex: 1, alignItems: "center" },
  detailLabel: { fontSize: 11, color: "#94A3B8", marginBottom: 3 },
  detailValue: { fontSize: 13, fontWeight: "700", color: "#1E293B", textAlign: "center" },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#059669", paddingVertical: 12, borderRadius: 10 },
  payBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  completedInfo: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#D1FAE5", padding: 10, borderRadius: 8 },
  completedInfoText: { fontSize: 12, color: "#059669", flex: 1, fontWeight: "600" },
  pendingInfo: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF3C7", padding: 10, borderRadius: 8 },
  pendingInfoText: { fontSize: 12, color: "#D97706", flex: 1 },
  browseAgainBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EFF6FF", paddingVertical: 10, borderRadius: 10 },
  browseAgainText: { color: "#2563EB", fontSize: 13, fontWeight: "600" },

  // Journey styles
  journeyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  journeyTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  journeyTitle: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  journeyContainer: { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, marginTop: 10 },
  journeyStep: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepNumberText: { fontSize: 12, fontWeight: "700" },
  stepLabelMain: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  stepStatus: { fontSize: 11, fontWeight: "500" },
  stepLine: { height: 20, width: 2, marginLeft: 13, marginBottom: 2 },

  // View Details Button
  viewDetailsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#EFF6FF", paddingVertical: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#BFDBFE" },
  viewDetailsBtnText: { color: "#2563EB", fontSize: 13, fontWeight: "700" },

  // Details Modal
  detailsModalContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  detailsHeader: { flexDirection: "row", alignItems: "flex-start", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  detailsTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  detailsAddress: { fontSize: 13, color: "#64748B" },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginLeft: 12 },
  detailsScroll: { flex: 1, padding: 16 },
  detailsSection: { marginBottom: 20 },
  detailsSectionTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  detailsItem: { flex: 1, minWidth: "48%", backgroundColor: "#fff", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  detailsItemLabel: { fontSize: 11, color: "#94A3B8", marginBottom: 4 },
  detailsItemValue: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  processSteps: { backgroundColor: "#fff", borderRadius: 10, padding: 14 },
  processStep: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  processStepCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  processStepNumber: { fontSize: 14, fontWeight: "700" },
  processStepName: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  processStepStatus: { fontSize: 11, fontWeight: "500" },
  qrCodeBox: { backgroundColor: "#fff", borderRadius: 10, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  qrPlaceholder: { width: 140, height: 140, backgroundColor: "#F8FAFC", borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  qrText: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  qrSubText: { fontSize: 12, color: "#64748B", marginBottom: 12 },
  generateQrBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#2563EB", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  generateQrBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  statusSummary: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 10, backgroundColor: "#FEF3C7" },
  statusSummaryTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  statusSummaryText: { fontSize: 12, color: "#64748B" },
  detailsActions: { flexDirection: "row", gap: 10, padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  detailsPayBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#059669", paddingVertical: 12, borderRadius: 10 },
  detailsPayBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  detailsCloseBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, backgroundColor: "#F1F5F9" },
  detailsCloseBtnText: { color: "#64748B", fontSize: 13, fontWeight: "700" },

  // Renew & Message buttons
  emptySub: { fontSize: 13, color: "#94A3B8", marginTop: 4, textAlign: "center" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  renewBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#059669", paddingVertical: 10, borderRadius: 10 },
  renewBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  messageBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#F5F3FF", paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#DDD6FE" },
  messageBtnText: { color: "#7C3AED", fontSize: 13, fontWeight: "700" },

  // Renew Lease Modal
  renewOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  renewSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
  renewTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  renewProp: { fontSize: 14, fontWeight: "600", color: "#2563EB", marginBottom: 4 },
  renewLabel: { fontSize: 13, color: "#64748B" },
  renewOption: { padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", marginBottom: 8, alignItems: "center" },
  renewOptionActive: { borderColor: "#059669", backgroundColor: "#F0FDF4" },
  renewOptionText: { fontSize: 15, fontWeight: "700", color: "#64748B" },
  renewOptionTextActive: { color: "#059669" },
  renewConfirmBtn: { backgroundColor: "#059669", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 12 },
  renewConfirmText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  renewCancelBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center", marginTop: 8 },
  renewCancelText: { color: "#94A3B8", fontSize: 14, fontWeight: "600" },
});
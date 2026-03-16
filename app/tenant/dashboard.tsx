import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
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
  created_at: string;
}

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

type StepStatus = "done" | "active" | "review" | "rejected" | "locked";

interface JourneyStep {
  id: string;
  icon: string;
  label: string;
  sublabel: string;
  status: StepStatus;
  actionLabel: string;
}

// ── helpers ────────────────────────────────────────────────────────────────

function getNextDueDate(moveIn: string): { dateStr: string; daysLeft: number } | null {
  if (!moveIn) return null;
  const parts = moveIn.split("-");
  if (parts.length < 3) return null;
  const day = parseInt(parts[2], 10);
  const now  = new Date();
  let due = new Date(now.getFullYear(), now.getMonth(), day);
  if (due.getTime() - now.getTime() <= 0) {
    due = new Date(now.getFullYear(), now.getMonth() + 1, day);
  }
  const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  const dateStr  = due.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
  return { dateStr, daysLeft };
}

function getMethodIcon(method: string): { name: string; color: string; bg: string } {
  if (method === "gcash")         return { name: "phone-portrait",   color: "#2563EB", bg: "#EFF6FF" };
  if (method === "card")          return { name: "card",             color: "#7C3AED", bg: "#F5F3FF" };
  if (method === "bank_transfer") return { name: "business",         color: "#0891B2", bg: "#ECFEFF" };
  return                                 { name: "cash",             color: "#059669", bg: "#F0FDF4" };
}

function getMethodLabel(method: string): string {
  if (method === "gcash")         return "GCash";
  if (method === "card")          return "Credit / Debit Card";
  if (method === "bank_transfer") return "Bank Transfer";
  return "Cash";
}

function deriveJourney(bookings: Booking[], payments: Payment[]): JourneyStep[] {
  const approved = bookings.find((b) => b.status === "approved");
  const pending  = bookings.find((b) => b.status === "pending");
  const active   = approved ?? pending ?? null;
  const cs       = active?.contract_status ?? "none";
  const hasPaid  = payments.some((p) => p.status === "paid" && p.booking_id === active?.id);

  let bookStep: JourneyStep;
  if (!active) {
    bookStep = { id: "booking", icon: "home-outline", label: "Booking", sublabel: "Not started", status: "active", actionLabel: "Book Now" };
  } else if (active.status === "pending") {
    bookStep = { id: "booking", icon: "home-outline", label: "Booking", sublabel: "Awaiting approval", status: "review", actionLabel: "View Status" };
  } else if (active.status === "approved") {
    bookStep = { id: "booking", icon: "home-outline", label: "Booking", sublabel: "Approved ✓", status: "done", actionLabel: "Approved" };
  } else {
    bookStep = { id: "booking", icon: "home-outline", label: "Booking", sublabel: "Rejected", status: "rejected", actionLabel: "Try Again" };
  }

  let contractStep: JourneyStep;
  if (!approved) {
    contractStep = { id: "contract", icon: "document-text-outline", label: "Contract", sublabel: "Locked", status: "locked", actionLabel: "Locked" };
  } else if (cs === "none") {
    contractStep = { id: "contract", icon: "document-text-outline", label: "Contract", sublabel: "Needs signing", status: "active", actionLabel: "Sign Now" };
  } else if (cs === "submitted") {
    contractStep = { id: "contract", icon: "document-text-outline", label: "Contract", sublabel: "Under review", status: "review", actionLabel: "In Review" };
  } else if (cs === "approved") {
    contractStep = { id: "contract", icon: "document-text-outline", label: "Contract", sublabel: "Approved ✓", status: "done", actionLabel: "Approved" };
  } else {
    contractStep = { id: "contract", icon: "document-text-outline", label: "Contract", sublabel: "Rejected", status: "rejected", actionLabel: "Resubmit" };
  }

  let payStep: JourneyStep;
  if (cs !== "approved") {
    payStep = { id: "payment", icon: "card-outline", label: "Payment", sublabel: "Locked", status: "locked", actionLabel: "Locked" };
  } else if (!hasPaid) {
    payStep = { id: "payment", icon: "card-outline", label: "Payment", sublabel: "Deposit due", status: "active", actionLabel: "Pay Now" };
  } else {
    payStep = { id: "payment", icon: "card-outline", label: "Payment", sublabel: "Paid ✓", status: "done", actionLabel: "Paid" };
  }

  const qrStep: JourneyStep = !hasPaid
    ? { id: "qr", icon: "qrcode", label: "QR Code", sublabel: "Locked",  status: "locked", actionLabel: "Locked" }
    : { id: "qr", icon: "qrcode", label: "QR Code", sublabel: "Ready ✓", status: "done",   actionLabel: "View QR" };

  return [bookStep, contractStep, payStep, qrStep];
}

const STATUS_COLORS: Record<StepStatus, { bg: string; border: string; text: string; icon: string; label: string }> = {
  done:     { bg: "#F0FDF4", border: "#16A34A", text: "#166534", icon: "#16A34A", label: "#16A34A" },
  active:   { bg: "#EFF6FF", border: "#2563EB", text: "#1E40AF", icon: "#2563EB", label: "#2563EB" },
  review:   { bg: "#FFFBEB", border: "#D97706", text: "#92400E", icon: "#D97706", label: "#D97706" },
  rejected: { bg: "#FEF2F2", border: "#DC2626", text: "#991B1B", icon: "#DC2626", label: "#DC2626" },
  locked:   { bg: "#F8FAFC", border: "#E2E8F0", text: "#94A3B8", icon: "#CBD5E1", label: "#94A3B8" },
};
const STATUS_ICONS: Record<StepStatus, string> = {
  done: "checkmark-circle", active: "arrow-forward-circle", review: "time",
  rejected: "close-circle", locked: "lock-closed",
};

// ── component ─────────────────────────────────────────────────────────────

export default function TenantDashboard() {
  const router  = useRouter();
  const [tenantName, setTenantName] = useState("Tenant");
  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [payments,   setPayments]   = useState<Payment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllPay, setShowAllPay] = useState(false);

  const fetchData = useCallback(async (userId: number) => {
    try {
      const [bRes, pRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.GET_BOOKINGS}?tenant_id=${userId}&_t=${Date.now()}`),
        fetch(`${API_ENDPOINTS.GET_PAYMENTS}?tenant_id=${userId}&_t=${Date.now()}`),
      ]);
      const bData = await bRes.json();
      const pData = await pRes.json();
      if (bData.status === "success") setBookings(bData.data ?? []);
      if (pData.status === "success") setPayments(pData.data ?? []);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    UserStorage.getUser().then((user) => {
      if (user) { setTenantName(user.fullname || "Tenant"); fetchData(user.user_id); }
      else setLoading(false);
    });
  }, [fetchData]);

  function onRefresh() {
    setRefreshing(true);
    UserStorage.getUser().then((u) => { if (u) fetchData(u.user_id); });
  }

  const journey          = deriveJourney(bookings, payments);
  const activeStep       = journey.find((s) => s.status === "active" || s.status === "review");
  const approvedBookings = bookings.filter((b) => b.status === "approved");
  const pendingBookings  = bookings.filter((b) => b.status === "pending");
  const paidPayments     = payments.filter((p) => p.status === "paid");
  const totalPaid        = paidPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const displayPayments  = showAllPay ? payments : payments.slice(0, 3);

  function handleStepPress(step: JourneyStep) {
    if (step.status === "locked") return;
    if (step.id === "booking" && step.status === "active") router.push("/tenant/browse-properties" as any);
    else router.push("/tenant/approvals" as any);
  }

  function statusColor(s: string) {
    if (s === "approved" || s === "paid") return "#059669";
    if (s === "pending") return "#D97706";
    return "#DC2626";
  }
  function statusBg(s: string) {
    if (s === "approved" || s === "paid") return "#D1FAE5";
    if (s === "pending") return "#FEF3C7";
    return "#FEE2E2";
  }

  return (
    <SafeAreaView style={S.container} edges={["top"]}>
      {/* ── Header ── */}
      <View style={S.header}>
        <View style={{ flex: 1 }}>
          <Text style={S.headerTitle}>My Dashboard</Text>
          <Text style={S.headerSub}>Welcome back, {tenantName}</Text>
        </View>
        <TouchableOpacity style={S.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={S.centerText}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          style={S.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={S.scrollContent}
        >

          {/* ── Rental Journey ── */}
          <View style={S.journeyCard}>
            <View style={S.journeyHeader}>
              <MaterialCommunityIcons name="map-marker-path" size={18} color="#2563EB" />
              <Text style={S.journeyTitle}>Rental Journey</Text>
              {activeStep && (
                <View style={[S.journeyBadge, { backgroundColor: STATUS_COLORS[activeStep.status].bg, borderColor: STATUS_COLORS[activeStep.status].border }]}>
                  <Text style={[S.journeyBadgeText, { color: STATUS_COLORS[activeStep.status].label }]}>
                    {activeStep.label}: {activeStep.actionLabel}
                  </Text>
                </View>
              )}
            </View>
            <View style={S.stepsRow}>
              {journey.map((step, i) => {
                const c = STATUS_COLORS[step.status];
                return (
                  <React.Fragment key={step.id}>
                    <TouchableOpacity
                      style={[S.stepBtn, { backgroundColor: c.bg, borderColor: c.border }]}
                      onPress={() => handleStepPress(step)}
                      activeOpacity={step.status === "locked" ? 1 : 0.75}
                    >
                      <Text style={[S.stepNum, { color: c.label }]}>{i + 1}</Text>
                      <View style={[S.stepIconCircle, { backgroundColor: c.border + "22" }]}>
                        <Ionicons
                          name={step.status === "locked" ? "lock-closed" : STATUS_ICONS[step.status] as any}
                          size={18} color={c.icon}
                        />
                      </View>
                      <Text style={[S.stepLabel, { color: c.text }]}>{step.label}</Text>
                      <Text style={[S.stepSublabel, { color: c.label }]} numberOfLines={1}>{step.sublabel}</Text>
                      {step.status !== "locked" && (
                        <View style={[S.stepActionPill, { backgroundColor: c.border }]}>
                          <Text style={S.stepActionText}>{step.actionLabel}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {i < 3 && (
                      <View style={S.stepArrow}>
                        <Ionicons name="chevron-forward" size={14} color={step.status === "done" ? "#16A34A" : "#CBD5E1"} />
                      </View>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
            <TouchableOpacity style={S.viewJourneyBtn} onPress={() => router.push("/tenant/approvals" as any)}>
              <MaterialCommunityIcons name="arrow-right" size={14} color="#2563EB" />
              <Text style={S.viewJourneyText}>Open Full Journey Details</Text>
            </TouchableOpacity>
          </View>

          {/* ── Stats ── */}
          <View style={S.statsRow}>
            {[
              { icon: "home-city",   label: "Active\nRentals",  value: String(approvedBookings.length),  bg: "#EFF6FF", color: "#2563EB" },
              { icon: "time-outline",label: "Pending\nBookings",value: String(pendingBookings.length),   bg: "#FFFBEB", color: "#D97706" },
              { icon: "cash-outline",label: "Total Paid",       value: `₱${totalPaid.toLocaleString()}`, bg: "#F0FDF4", color: "#059669" },
            ].map((s, i) => (
              <View key={i} style={[S.statCard, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
                <Text style={[S.statValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
                <Text style={S.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Monthly Rent Due Dates ── */}
          {approvedBookings.length > 0 && (
            <View style={S.sectionCard}>
              <View style={S.sectionHeader}>
                <Ionicons name="calendar-outline" size={16} color="#0F172A" />
                <Text style={S.sectionTitle}>Monthly Rent Due Dates</Text>
              </View>
              {approvedBookings.map((b) => {
                const due      = getNextDueDate(b.move_in);
                const urgent   = due && due.daysLeft <= 7;
                const soon     = due && due.daysLeft <= 15;
                const dueColor = urgent ? "#DC2626" : soon ? "#D97706" : "#059669";
                const dueBg    = urgent ? "#FEF2F2" : soon ? "#FFFBEB" : "#F0FDF4";
                return (
                  <View key={b.id} style={[S.dueCard, { backgroundColor: dueBg, borderColor: dueColor + "40" }]}>
                    <View style={[S.dueIconWrap, { backgroundColor: dueColor + "18" }]}>
                      <Ionicons name="calendar" size={18} color={dueColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.duePropName} numberOfLines={1}>{b.property_name}</Text>
                      <Text style={[S.dueDateText, { color: dueColor }]}>
                        Due: {due ? due.dateStr : "—"}
                      </Text>
                      <Text style={S.dueMeta}>
                        {b.lease_duration} lease
                        {due ? ` · ${due.daysLeft} day${due.daysLeft !== 1 ? "s" : ""} left` : ""}
                      </Text>
                    </View>
                    <View style={S.dueAmountWrap}>
                      <Text style={[S.dueAmount, { color: dueColor }]}>
                        ₱{Number(b.property_price).toLocaleString()}
                      </Text>
                      <Text style={S.dueAmountLabel}>/month</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── My Bookings ── */}
          <View style={S.sectionCard}>
            <View style={S.sectionHeader}>
              <Ionicons name="home-outline" size={16} color="#0F172A" />
              <Text style={S.sectionTitle}>My Bookings</Text>
              {bookings.length > 0 && (
                <TouchableOpacity onPress={() => router.push("/tenant/approvals" as any)}>
                  <Text style={S.seeAll}>See all →</Text>
                </TouchableOpacity>
              )}
            </View>
            {bookings.length === 0 ? (
              <View style={S.emptyBox}>
                <MaterialCommunityIcons name="home-search-outline" size={40} color="#CBD5E1" />
                <Text style={S.emptyText}>No bookings yet</Text>
                <TouchableOpacity style={S.browseBtn} onPress={() => router.push("/tenant/browse-properties" as any)}>
                  <Text style={S.browseBtnText}>Browse Properties</Text>
                </TouchableOpacity>
              </View>
            ) : (
              bookings.slice(0, 3).map((b) => (
                <TouchableOpacity key={b.id} style={S.bookingCard} onPress={() => router.push("/tenant/approvals" as any)} activeOpacity={0.75}>
                  <View style={[S.bookingStatusBar, { backgroundColor: statusColor(b.status) }]} />
                  <View style={S.bookingBody}>
                    <View style={S.bookingTopRow}>
                      <Text style={S.bookingProp} numberOfLines={1}>{b.property_name}</Text>
                      <View style={[S.badge, { backgroundColor: statusBg(b.status) }]}>
                        <Text style={[S.badgeText, { color: statusColor(b.status) }]}>{b.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={S.bookingAddr} numberOfLines={1}>{b.property_address}</Text>
                    <View style={S.metaRow}>
                      <Ionicons name="calendar-outline" size={11} color="#94A3B8" />
                      <Text style={S.metaText}>Move-in: {b.move_in}</Text>
                      <Text style={S.dot}>·</Text>
                      <Ionicons name="time-outline" size={11} color="#94A3B8" />
                      <Text style={S.metaText}>{b.lease_duration}</Text>
                    </View>
                    <View style={S.metaRow}>
                      <Ionicons name="cash-outline" size={11} color="#94A3B8" />
                      <Text style={S.metaText}>₱{Number(b.property_price).toLocaleString()}/mo</Text>
                      {b.contract_status && b.contract_status !== "none" && (
                        <>
                          <Text style={S.dot}>·</Text>
                          <Text style={S.metaText}>Contract: {b.contract_status}</Text>
                        </>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* ── Transaction History ── */}
          {payments.length > 0 && (
            <View style={S.sectionCard}>
              <View style={S.sectionHeader}>
                <Ionicons name="receipt-outline" size={16} color="#0F172A" />
                <Text style={S.sectionTitle}>Transaction History</Text>
              </View>

              {/* Summary strip */}
              <View style={S.txnSummary}>
                <View style={S.txnSumItem}>
                  <Text style={S.txnSumVal}>₱{totalPaid.toLocaleString()}</Text>
                  <Text style={S.txnSumLabel}>Total Paid</Text>
                </View>
                <View style={S.txnSumDivider} />
                <View style={S.txnSumItem}>
                  <Text style={S.txnSumVal}>{paidPayments.length}</Text>
                  <Text style={S.txnSumLabel}>Completed</Text>
                </View>
                <View style={S.txnSumDivider} />
                <View style={S.txnSumItem}>
                  <Text style={S.txnSumVal}>{payments.length - paidPayments.length}</Text>
                  <Text style={S.txnSumLabel}>Pending</Text>
                </View>
              </View>

              {displayPayments.map((p) => {
                const mi     = getMethodIcon(p.method);
                const isPaid = p.status === "paid";
                const dt     = new Date(p.created_at);
                const dateStr = isNaN(dt.getTime())
                  ? p.created_at
                  : dt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
                const timeStr = isNaN(dt.getTime()) ? "" : dt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
                return (
                  <View key={p.id} style={S.txnCard}>
                    <View style={[S.txnIcon, { backgroundColor: mi.bg }]}>
                      <Ionicons name={mi.name as any} size={18} color={mi.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={S.txnTopRow}>
                        <Text style={S.txnProp} numberOfLines={1}>{p.property_name}</Text>
                        <Text style={[S.txnAmt, { color: isPaid ? "#059669" : "#D97706" }]}>
                          ₱{Number(p.amount).toLocaleString()}
                        </Text>
                      </View>
                      <View style={S.txnMidRow}>
                        <View style={[S.txnMethodBadge, { backgroundColor: mi.bg }]}>
                          <Text style={[S.txnMethodText, { color: mi.color }]}>{getMethodLabel(p.method)}</Text>
                        </View>
                        <View style={[S.badge, { backgroundColor: isPaid ? "#D1FAE5" : "#FEF3C7" }]}>
                          <Text style={[S.badgeText, { color: isPaid ? "#059669" : "#D97706" }]}>
                            {p.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={S.txnMetaRow}>
                        <Ionicons name="receipt-outline" size={10} color="#94A3B8" />
                        <Text style={S.txnMeta} numberOfLines={1}>TXN: {p.transaction_id}</Text>
                      </View>
                      <View style={S.txnMetaRow}>
                        <Ionicons name="time-outline" size={10} color="#94A3B8" />
                        <Text style={S.txnMeta}>{dateStr}{timeStr ? `  ·  ${timeStr}` : ""}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {payments.length > 3 && (
                <TouchableOpacity style={S.showMoreBtn} onPress={() => setShowAllPay(!showAllPay)}>
                  <Text style={S.showMoreText}>
                    {showAllPay ? "Show less ▲" : `Show all ${payments.length} transactions ▼`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── styles ─────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#F1F5F9" },
  header:      { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerSub:   { fontSize: 12, color: "#64748B", marginTop: 1 },
  refreshBtn:  { width: 34, height: 34, borderRadius: 8, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  center:      { alignItems: "center", paddingVertical: 80 },
  centerText:  { marginTop: 12, color: "#64748B", fontSize: 14 },
  scroll:      { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 40 },

  // Journey card
  journeyCard:      { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: "#2563EB", shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  journeyHeader:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  journeyTitle:     { fontSize: 15, fontWeight: "800", color: "#0F172A", flex: 1 },
  journeyBadge:     { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  journeyBadgeText: { fontSize: 10, fontWeight: "700" },
  stepsRow:         { flexDirection: "row", alignItems: "flex-start", gap: 2, marginBottom: 12 },
  stepBtn:          { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 10, alignItems: "center", gap: 4, minHeight: 110 },
  stepNum:          { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  stepIconCircle:   { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  stepLabel:        { fontSize: 11, fontWeight: "700", textAlign: "center" },
  stepSublabel:     { fontSize: 9, textAlign: "center", fontWeight: "500" },
  stepActionPill:   { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginTop: 2 },
  stepActionText:   { fontSize: 9, color: "#fff", fontWeight: "800" },
  stepArrow:        { paddingTop: 44, alignItems: "center" },
  viewJourneyBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EFF6FF", paddingVertical: 10, borderRadius: 10 },
  viewJourneyText:  { fontSize: 13, color: "#2563EB", fontWeight: "700" },

  // Stats
  statsRow:  { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard:  { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 4 },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 10, color: "#64748B", textAlign: "center" },

  // Shared section card
  sectionCard:   { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle:  { fontSize: 15, fontWeight: "700", color: "#0F172A", flex: 1 },
  seeAll:        { fontSize: 13, color: "#2563EB", fontWeight: "600" },

  // Due dates
  dueCard:       { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10 },
  dueIconWrap:   { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  duePropName:   { fontSize: 13, fontWeight: "700", color: "#1E293B" },
  dueDateText:   { fontSize: 12, fontWeight: "600", marginTop: 2 },
  dueMeta:       { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  dueAmountWrap: { alignItems: "flex-end" },
  dueAmount:     { fontSize: 15, fontWeight: "800" },
  dueAmountLabel:{ fontSize: 10, color: "#94A3B8" },

  // Bookings list
  emptyBox:     { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyText:    { fontSize: 14, color: "#94A3B8", fontWeight: "600" },
  browseBtn:    { backgroundColor: "#1D4ED8", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  browseBtnText:{ color: "#fff", fontSize: 13, fontWeight: "700" },
  bookingCard:  { flexDirection: "row", backgroundColor: "#F8FAFC", borderRadius: 10, marginBottom: 8, overflow: "hidden" },
  bookingStatusBar: { width: 4 },
  bookingBody:  { flex: 1, padding: 10 },
  bookingTopRow:{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  bookingProp:  { fontSize: 13, fontWeight: "700", color: "#1E293B", flex: 1, marginRight: 6 },
  bookingAddr:  { fontSize: 11, color: "#64748B", marginBottom: 4 },
  metaRow:      { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText:     { fontSize: 11, color: "#94A3B8" },
  dot:          { fontSize: 10, color: "#CBD5E1" },

  // Transactions
  txnSummary:    { flexDirection: "row", backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, marginBottom: 12 },
  txnSumItem:    { flex: 1, alignItems: "center", gap: 2 },
  txnSumVal:     { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  txnSumLabel:   { fontSize: 10, color: "#64748B" },
  txnSumDivider: { width: 1, backgroundColor: "#E2E8F0", marginVertical: 4 },
  txnCard:       { flexDirection: "row", gap: 10, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, marginBottom: 8 },
  txnIcon:       { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  txnTopRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  txnProp:       { fontSize: 13, fontWeight: "700", color: "#1E293B", flex: 1, marginRight: 6 },
  txnAmt:        { fontSize: 14, fontWeight: "800" },
  txnMidRow:     { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  txnMethodBadge:{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  txnMethodText: { fontSize: 10, fontWeight: "700" },
  txnMetaRow:    { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  txnMeta:       { fontSize: 10, color: "#94A3B8" },
  showMoreBtn:   { alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#E2E8F0", marginTop: 4 },
  showMoreText:  { fontSize: 13, color: "#2563EB", fontWeight: "600" },

  // Shared badge
  badge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
});

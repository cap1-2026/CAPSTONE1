// app/owner/bookings.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Linking, Modal, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import API_ENDPOINTS, { API_BASE_URL } from "../../config/api";
import { UserStorage } from "../../utils/userStorage";
import { sendNotification } from "../../utils/notifications";
import { showAlert } from "../../utils/alerts";

const BASE = API_BASE_URL;

interface Booking {
  id: number;
  tenant_id: number;
  tenant_name: string;
  tenant_email: string;
  phone: string;
  property_name: string;
  property_address: string;
  property_price: number;
  property_deposit?: number;
  move_in: string;
  lease_duration: string;
  occupants: number;
  status: "pending" | "approved" | "rejected";
  contract_status: "none" | "submitted" | "approved" | "rejected";
  contract_face_photo: string;
  contract_id_photo: string;
  lease_contract_file?: string;
  tenant_signature?: string;
  created_at: string;
  special_request?: string;
  payment_status?: "none" | "pending_owner_approval" | "approved" | "rejected";
  property_type?: string;
}

export default function OwnerBookingsPage() {
  const router = useRouter();
  const [filter, setFilter]   = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [ownerId, setOwnerId]   = useState<number | null>(null);
  const [approveModal, setApproveModal] = useState<{
    bookingId: number;
    booking: Booking;
    approving: boolean;
  } | null>(null);
  const [contractViewModal, setContractViewModal] = useState<{ booking: Booking } | null>(null);

  const fetchBookings = useCallback(async (id: number) => {
    try {
      const res  = await fetch(`${BASE}/get_bookings.php?owner_id=${id}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") setBookings(data.data ?? []);
      else showAlert("Error", data.message || "Could not load bookings.");
    } catch {
      showAlert("Error", "Cannot reach server. Make sure XAMPP is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    UserStorage.getUser("owner").then((user) => {
      if (user) { setOwnerId(user.user_id); fetchBookings(user.user_id); }
      else setLoading(false);
    });
  }, [fetchBookings]);

  // ── Direct approve/reject — no Alert confirmation wrapper ─────────────────
  async function handleAction(bookingId: number, action: "approved" | "rejected") {
    setActionLoading(bookingId);
    try {
      const res  = await fetch(`${BASE}/approve_booking.php`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ booking_id: bookingId, action }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {
        showAlert("Server Error", `Unexpected response:\n${text.slice(0, 200)}`);
        return;
      }

      if (data.status === "success") {
        setBookings((prev) =>
          prev.map((b) => b.id === bookingId ? { ...b, status: action } : b)
        );
        const booking = bookings.find(b => b.id === bookingId);
        if (booking?.tenant_id) {
          if (action === "approved") {
            await sendNotification(booking.tenant_id, "tenant", "booking",
              "Booking Approved!",
              `Your booking for "${booking.property_name}" has been approved by the owner. Please proceed to submit your contract.`,
              bookingId, "approval");
          } else {
            await sendNotification(booking.tenant_id, "tenant", "booking",
              "Booking Rejected",
              `Your booking for "${booking.property_name}" has been rejected by the owner.`,
              bookingId, "approval");
          }
        }
      } else {
        showAlert("Failed", data.message ?? "Please try again.");
      }
    } catch (e: any) {
      showAlert("Connection Error", e?.message ?? "Could not reach the server.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleContractAction(bookingId: number, action: "approved" | "rejected") {
    const label = action === "approved" ? "Approve" : "Reject";
    const confirmed = Platform.OS === "web"
      ? window.confirm(`${label} this tenant's contract?`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(`${label} Contract`, `${label} this tenant's contract?`, [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: label, onPress: () => resolve(true) },
          ]);
        });
    if (!confirmed) return;

    setActionLoading(bookingId);
    try {
      const res  = await fetch(`${BASE}/approve_contract.php`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ booking_id: bookingId, action }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setBookings((prev) =>
          prev.map((b) => b.id === bookingId ? { ...b, contract_status: action } : b)
        );
        const booking = bookings.find(b => b.id === bookingId);
        if (booking?.tenant_id) {
          if (action === "approved") {
            await sendNotification(booking.tenant_id, "tenant", "contract",
              "Contract Approved!",
              `Your contract for "${booking.property_name}" has been approved. Please proceed to pay the security deposit.`,
              bookingId, "payment");
          } else {
            await sendNotification(booking.tenant_id, "tenant", "contract",
              "Contract Rejected",
              `Your contract submission for "${booking.property_name}" was rejected. Please review and resubmit.`,
              bookingId, "approval");
          }
        }
      } else {
        showAlert("Failed", data.message ?? "Please try again.");
      }
    } catch (e: any) {
      showAlert("Connection Error", e?.message ?? "Could not reach the server.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePaymentAction(bookingId: number, action: "approved" | "rejected") {
    const label = action === "approved" ? "Approve" : "Reject";
    const confirmed = Platform.OS === "web"
      ? window.confirm(`${label} this tenant's payment?`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(`${label} Payment`, `${label} this tenant's security deposit payment?`, [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: label, onPress: () => resolve(true) },
          ]);
        });
    if (!confirmed) return;

    setActionLoading(bookingId);
    try {
      const res  = await fetch(API_ENDPOINTS.APPROVE_PAYMENT, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ booking_id: bookingId, action }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setBookings((prev) =>
          prev.map((b) => b.id === bookingId ? { ...b, payment_status: action } : b)
        );
        const booking = bookings.find(b => b.id === bookingId);
        if (booking?.tenant_id) {
          if (action === "approved") {
            await sendNotification(booking.tenant_id, "tenant", "payment",
              "Payment Approved — QR Code Ready!",
              `Your security deposit payment for "${booking.property_name}" has been approved. Your QR access code is now active!`,
              bookingId, "qr");
          } else {
            await sendNotification(booking.tenant_id, "tenant", "payment",
              "Payment Rejected",
              `Your payment for "${booking.property_name}" was rejected by the owner. Please submit payment again.`,
              bookingId, "payment");
          }
        }
      } else {
        showAlert("Failed", data.message ?? "Please try again.");
      }
    } catch (e: any) {
      showAlert("Connection Error", e?.message ?? "Could not reach the server.");
    } finally {
      setActionLoading(null);
    }
  }

  // Parse lease duration string and calculate end date
  function calculateEndDate(moveInDate: string, duration: string): Date {
    const startDate = new Date(moveInDate);
    const durationLower = duration.toLowerCase().trim();

    let months = 0;
    const monthMatch = durationLower.match(/(\d+)\s*month/);
    const yearMatch = durationLower.match(/(\d+)\s*year/);

    if (monthMatch) {
      months = parseInt(monthMatch[1], 10);
    } else if (yearMatch) {
      months = parseInt(yearMatch[1], 10) * 12;
    } else {
      // Default to 1 month if parsing fails
      months = 1;
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    return endDate;
  }

  // Check for date conflicts with approved bookings
  function hasDateConflict(booking: Booking): boolean {
    const moveInDate = new Date(booking.move_in);
    const endDate = calculateEndDate(booking.move_in, booking.lease_duration);

    // Check all approved bookings for the same property
    return bookings.some((b) => {
      if (b.status !== "approved" || b.id === booking.id) return false;
      if (b.property_name !== booking.property_name) return false;

      const bMoveIn = new Date(b.move_in);
      const bEndDate = calculateEndDate(b.move_in, b.lease_duration);

      // Check if date ranges overlap
      return moveInDate < bEndDate && endDate > bMoveIn;
    });
  }

  async function handleApproveBooking() {
    if (!approveModal || !ownerId) return;

    // Check for date conflicts
    if (hasDateConflict(approveModal.booking)) {
      showAlert(
        "Booking Conflict",
        `Cannot approve this booking. The apartment is already booked during this period. Please check other bookings for "${approveModal.booking.property_name}".`
      );
      setApproveModal((prev) => prev ? { ...prev, approving: false } : null);
      return;
    }

    setApproveModal((prev) => prev ? { ...prev, approving: true } : null);
    try {
      const res  = await fetch(`${BASE}/approve_booking.php`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ booking_id: approveModal.bookingId, action: "approved" }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {
        showAlert("Server Error", `Unexpected response:\n${text.slice(0, 200)}`);
        setApproveModal((prev) => prev ? { ...prev, approving: false } : null);
        return;
      }
      if (data.status === "success") {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === approveModal.bookingId
              ? { ...b, status: "approved", contract_status: "none" }
              : b
          )
        );
        await sendNotification(
          approveModal.booking.tenant_id, "tenant", "booking",
          "Booking Approved!",
          `Your booking for "${approveModal.booking.property_name}" has been approved. Your lease contract is ready for your digital signature.`,
          approveModal.bookingId, "approval"
        );
        setApproveModal(null);
      } else {
        showAlert("Failed", data.message ?? "Please try again.");
        setApproveModal((prev) => prev ? { ...prev, approving: false } : null);
      }
    } catch (e: any) {
      showAlert("Connection Error", e?.message ?? "Could not reach the server.");
      setApproveModal((prev) => prev ? { ...prev, approving: false } : null);
    }
  }

  const filtered = bookings.filter((b) =>
    filter === "all" ? true : b.status === filter
  );
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  // ── Contract review modal ────────────────────────────────────────────────
  function renderContractViewModal() {
    if (!contractViewModal) return null;
    const b = contractViewModal.booking;
    const today = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    const ref   = `PF-${String(b.id).padStart(6, "0")}`;
    const rent  = Number(b.property_price).toLocaleString();
    const dep   = Number(b.property_deposit ?? b.property_price).toLocaleString();
    const isTransient = (b.property_type ?? "").toLowerCase() === "transient";

    // Use actual signature path from database, with multiple fallbacks
    const getSignatureUrl = () => {
      if (b.tenant_signature) {
        // If we have a signature path in the database, use it
        if (b.tenant_signature.startsWith('http')) {
          return b.tenant_signature; // Already a full URL
        }
        return `${BASE}/${b.tenant_signature}`; // Add base URL to relative path
      }

      // Fallback attempts for different possible filenames
      return `${BASE}/uploads/signatures/sig_only_${b.id}.jpg`;
    };

    const sigOnlyUrl = getSignatureUrl();

    const clauses: [string, string][] = [
      ["1. RENTAL PAYMENT", `Monthly rent of ₱${rent} is due on or before the 1st of each month. A grace period of five (5) days is provided. Payments after the grace period are subject to a ₱200/day late fee.`],
      ["2. SECURITY DEPOSIT", `A deposit of ₱${dep} is held in escrow. Returned within 30 days after vacating, less any deductions for damages beyond normal wear and tear.`],
      ["3. USE OF PREMISES", `The property shall be used exclusively as a private residential dwelling for a maximum of ${b.occupants} occupant(s). Commercial activities and subletting are strictly prohibited without written consent from the LESSOR. Any unauthorized use may result in immediate termination of this agreement.`],
      ["4. MAINTENANCE & REPAIRS", "The LESSEE shall keep the property clean and in good condition throughout the duration of the tenancy. Damage caused by the LESSEE's negligence shall be repaired at the LESSEE's expense. Normal wear and tear is accepted and shall not be charged against the security deposit."],
      ["5. ALTERATIONS", "The LESSEE shall not make any structural alterations or modifications to the property without prior written consent from the LESSOR. Any approved alterations shall become part of the property and shall not be removed upon vacating unless otherwise agreed in writing."],
      ["6. TERMINATION", "Either party may terminate this agreement with a minimum of 30 days written notice prior to the intended date of termination. Early termination by the LESSEE without proper notice may result in forfeiture of the security deposit. The LESSOR reserves the right to terminate this agreement immediately in cases of material breach by the LESSEE."],
      ["7. COMPLIANCE", "The LESSEE shall comply with all applicable laws, local ordinances, and property rules throughout the lease period. Illegal activities on the premises are grounds for immediate termination of this agreement. The LESSEE shall also respect the rights and comfort of neighboring tenants and residents."],
    ];

    const canAct = b.contract_status === "submitted";

    return (
      <Modal visible animationType="slide" onRequestClose={() => setContractViewModal(null)}>
        <View style={CV.root}>

          {/* Top bar */}
          <View style={CV.topBar}>
            <View style={{ flex: 1 }}>
              <Text style={CV.topBarTitle}>Lease Contract Review</Text>
              <Text style={CV.topBarSub}>{ref} · {b.tenant_name}</Text>
            </View>
            <TouchableOpacity onPress={() => setContractViewModal(null)} style={CV.closeBtn}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={CV.scroll} contentContainerStyle={CV.scrollContent} showsVerticalScrollIndicator={false}>

            {/* ── Contract document ── */}
            <View style={CV.contractDoc}>

              {/* Header */}
              <View style={CV.header}>
                <Text style={CV.headerTitle}>LEASE AGREEMENT</Text>
                <Text style={CV.headerRef}>{ref}</Text>
                <Text style={CV.headerDate}>{today}</Text>
              </View>

              {/* Preamble */}
              <Text style={CV.preamble}>
                This Lease Agreement is entered into on <Text style={CV.bold}>{today}</Text> between the property owner (<Text style={CV.bold}>"LESSOR"</Text>) and the undersigned tenant (<Text style={CV.bold}>"LESSEE"</Text>), under the terms and conditions set forth herein.
              </Text>

              {/* Parties */}
              <View style={CV.section}>
                <Text style={CV.sectionTitle}>PARTIES TO THE AGREEMENT</Text>
                {[["LESSEE (Tenant)", b.tenant_name], ["Property Name", b.property_name]].map(([l, v]) => (
                  <View key={l} style={CV.fieldRow}>
                    <Text style={CV.fieldLabel}>{l}</Text>
                    <Text style={CV.fieldValue}>{v}</Text>
                  </View>
                ))}
              </View>

              {/* Subject Property */}
              <View style={CV.section}>
                <Text style={CV.sectionTitle}>SUBJECT PROPERTY</Text>
                {[["Property Name", b.property_name], ["Address", b.property_address]].map(([l, v]) => (
                  <View key={l} style={CV.fieldRow}>
                    <Text style={CV.fieldLabel}>{l}</Text>
                    <Text style={CV.fieldValue}>{v}</Text>
                  </View>
                ))}
              </View>

              {/* Lease Terms */}
              <View style={CV.section}>
                <Text style={CV.sectionTitle}>LEASE TERMS</Text>
                {([
                  ["Move-in Date",     b.move_in],
                  ["Lease Duration",   b.lease_duration],
                  ["Monthly Rent",     `₱${rent}`],
                  ["Security Deposit", `₱${dep}`],
                  ["No. of Occupants", `${b.occupants} person(s)`],
                ] as [string, string][]).map(([l, v]) => (
                  <View key={l} style={CV.fieldRow}>
                    <Text style={CV.fieldLabel}>{l}</Text>
                    <Text style={[CV.fieldValue, CV.bold]}>{v}</Text>
                  </View>
                ))}
              </View>

              {/* T&C */}
              {!isTransient && (
                <View style={CV.section}>
                  <Text style={CV.sectionTitle}>TERMS AND CONDITIONS</Text>
                  {clauses.map(([title, body]) => (
                    <View key={title} style={CV.clause}>
                      <Text style={CV.clauseTitle}>{title}</Text>
                      <Text style={CV.clauseBody}>{body}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Acknowledgement */}
              <Text style={[CV.preamble, { borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 12, marginTop: 8 }]}>
                {isTransient
                  ? "By affixing their digital signature below, the LESSEE confirms their intent to occupy the property during the agreed period and agrees to the house rules and check-in/check-out conditions of the LESSOR."
                  : "By affixing their digital signature below, the LESSEE confirms they have read, understood, and voluntarily agreed to all terms and conditions of this Lease Agreement."}
              </Text>
            </View>

            {/* ── Signature ── */}
            <View style={CV.sigSection}>
              <View style={CV.sigLabelRow}>
                <Ionicons name="create-outline" size={15} color="#1D4ED8" />
                <Text style={CV.sigLabel}>TENANT'S DIGITAL SIGNATURE</Text>
              </View>

              {b.tenant_signature ? (
                <View>
                  <Image
                    source={{ uri: sigOnlyUrl }}
                    style={CV.sigImage}
                    resizeMode="contain"
                    onError={(error) => {
                      console.log('Signature image load error:', error);
                      console.log('Attempted URL:', sigOnlyUrl);
                      console.log('Signature path from DB:', b.tenant_signature);
                    }}
                  />
                  <Text style={CV.sigNote}>Digitally signed by {b.tenant_name}</Text>
                  <Text style={[CV.sigNote, { fontSize: 10, color: '#94A3B8', marginTop: 4 }]}>
                    Path: {b.tenant_signature}
                  </Text>
                </View>
              ) : (
                <View style={[CV.sigImage, { backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="document-outline" size={24} color="#CBD5E1" />
                  <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>No signature available</Text>
                </View>
              )}
            </View>

            {/* ── Actions (only when pending decision) ── */}
            {canAct && (
              <View style={CV.actions}>
                <TouchableOpacity
                  style={[CV.rejectBtn, actionLoading === b.id && { opacity: 0.5 }]}
                  onPress={async () => { await handleContractAction(b.id, "rejected"); setContractViewModal(null); }}
                  disabled={actionLoading === b.id}
                >
                  {actionLoading === b.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Ionicons name="close-circle" size={18} color="#fff" /><Text style={CV.rejectBtnText}>Reject Contract</Text></>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[CV.approveBtn, actionLoading === b.id && { opacity: 0.5 }]}
                  onPress={async () => { await handleContractAction(b.id, "approved"); setContractViewModal(null); }}
                  disabled={actionLoading === b.id}
                >
                  {actionLoading === b.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={CV.approveBtnText}>Approve Contract</Text></>}
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  }

  const statusColor = (s: string) =>
    s === "approved" ? "#4CAF50" : s === "pending" ? "#FF9800" : "#F44336";
  const statusIcon  = (s: string): any =>
    s === "approved" ? "checkmark-circle" : s === "pending" ? "time" : "close-circle";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Booking Requests</Text>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => { if (ownerId) { setLoading(true); fetchBookings(ownerId); } }}
        >
          <Ionicons name="refresh-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.emptyStateText, { marginTop: 16 }]}>Loading...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No booking requests found</Text>
          </View>
        ) : (
          filtered.map((booking) => (
            <View style={styles.card} key={booking.id}>
              {/* Status badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusColor(booking.status) }]}>
                <Ionicons name={statusIcon(booking.status)} size={14} color="#fff" />
                <Text style={styles.statusBadgeText}>{booking.status.toUpperCase()}</Text>
              </View>

              {/* Tenant */}
              <View style={styles.tenantSection}>
                <View style={styles.tenantAvatar}>
                  <Ionicons name="person" size={26} color="#007AFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tenantName}>{booking.tenant_name}</Text>
                  <Text style={styles.contactText}>{booking.tenant_email}</Text>
                  {booking.phone ? <Text style={styles.contactText}>{booking.phone}</Text> : null}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Property */}
              <Text style={styles.sectionLabel}>PROPERTY</Text>
              <Text style={styles.propertyName}>{booking.property_name}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={13} color="#666" />
                <Text style={styles.propertyAddress}>{booking.property_address}</Text>
              </View>

              <View style={styles.divider} />

              {/* Details */}
              <Text style={styles.sectionLabel}>BOOKING INFO</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={15} color="#666" />
                  <Text style={styles.detailLabel}>Move-in:</Text>
                  <Text style={styles.detailValue}>{booking.move_in}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={15} color="#666" />
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{booking.lease_duration}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={15} color="#666" />
                  <Text style={styles.detailLabel}>Monthly Rent:</Text>
                  <Text style={styles.detailValue}>₱{Number(booking.property_price).toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={15} color="#666" />
                  <Text style={styles.detailLabel}>Occupants:</Text>
                  <Text style={styles.detailValue}>{booking.occupants}</Text>
                </View>
              </View>

              {booking.special_request ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{booking.special_request}</Text>
                </View>
              ) : null}

              <Text style={styles.submittedDate}>
                Submitted {new Date(booking.created_at).toLocaleDateString()}
              </Text>

              {/* ── ACTION BUTTONS — only for pending ── */}
              {booking.status === "pending" && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.rejectButton, actionLoading === booking.id && { opacity: 0.5 }]}
                    onPress={() => handleAction(booking.id, "rejected")}
                    disabled={actionLoading === booking.id}
                  >
                    {actionLoading === booking.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="close-circle" size={18} color="#fff" /><Text style={styles.rejectButtonText}>Reject</Text></>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.approveButton, actionLoading === booking.id && { opacity: 0.5 }]}
                    onPress={() => setApproveModal({ bookingId: booking.id, booking, approving: false })}
                    disabled={actionLoading === booking.id}
                  >
                    {actionLoading === booking.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.approveButtonText}>Approve Booking</Text></>}
                  </TouchableOpacity>
                </View>
              )}

              {booking.status === "approved" && (() => {
                const cs = booking.contract_status ?? "none";

                if (cs === "none") return (
                  <View style={styles.approvedInfo}>
                    <Ionicons name="checkmark-circle" size={15} color="#4CAF50" />
                    <Text style={styles.approvedInfoText}>Booking approved — lease contract sent. Waiting for tenant to sign.</Text>
                  </View>
                );

                if (cs === "submitted") {
                  return (
                    <View>
                      <View style={styles.contractBanner}>
                        <Ionicons name="pencil" size={15} color="#1D4ED8" />
                        <Text style={styles.contractBannerText}>Tenant has signed the contract — review and decide.</Text>
                      </View>

                      {/* Review button */}
                      <TouchableOpacity
                        style={styles.reviewContractBtn}
                        onPress={() => setContractViewModal({ booking })}
                        activeOpacity={0.8}
                      >
                        <View style={styles.reviewContractIcon}>
                          <Ionicons name="document-text" size={22} color="#1D4ED8" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewContractTitle}>View Lease Agreement</Text>
                          <Text style={styles.reviewContractSub}>Read full contract + tenant's signature</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#1D4ED8" />
                      </TouchableOpacity>

                      <View style={styles.contractActions}>
                        <TouchableOpacity
                          style={[styles.rejectButton, actionLoading === booking.id && { opacity: 0.5 }]}
                          onPress={() => handleContractAction(booking.id, "rejected")}
                          disabled={actionLoading === booking.id}
                        >
                          {actionLoading === booking.id
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <><Ionicons name="close-circle" size={16} color="#fff" /><Text style={styles.rejectButtonText}>Reject</Text></>}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.approveButton, actionLoading === booking.id && { opacity: 0.5 }]}
                          onPress={() => handleContractAction(booking.id, "approved")}
                          disabled={actionLoading === booking.id}
                        >
                          {actionLoading === booking.id
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <><Ionicons name="checkmark-circle" size={16} color="#fff" /><Text style={styles.approveButtonText}>Approve Contract</Text></>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }

                if (cs === "approved") {
                  const ps  = booking.payment_status ?? "none";
                  return (
                    <View>
                      <TouchableOpacity
                        style={[styles.reviewContractBtn, { marginBottom: 10 }]}
                        onPress={() => setContractViewModal({ booking })}
                        activeOpacity={0.8}
                      >
                        <View style={styles.reviewContractIcon}>
                          <Ionicons name="document-text" size={22} color="#1D4ED8" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewContractTitle}>View Signed Lease Agreement</Text>
                          <Text style={styles.reviewContractSub}>Contract approved — tap to review</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#1D4ED8" />
                      </TouchableOpacity>

                      {ps === "none" && (
                        <View style={styles.approvedInfo}>
                          <Ionicons name="checkmark-circle" size={15} color="#4CAF50" />
                          <Text style={styles.approvedInfoText}>Contract approved — waiting for tenant to pay security deposit.</Text>
                        </View>
                      )}
                      {ps === "pending_owner_approval" && (
                        <View>
                          <View style={styles.paymentBanner}>
                            <Ionicons name="cash" size={15} color="#1D4ED8" />
                            <Text style={styles.paymentBannerText}>Tenant has paid the security deposit — review and approve.</Text>
                          </View>
                          <View style={styles.contractActions}>
                            <TouchableOpacity
                              style={[styles.rejectButton, actionLoading === booking.id && { opacity: 0.5 }]}
                              onPress={() => handlePaymentAction(booking.id, "rejected")}
                              disabled={actionLoading === booking.id}
                            >
                              {actionLoading === booking.id
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <><Ionicons name="close-circle" size={16} color="#fff" /><Text style={styles.rejectButtonText}>Reject</Text></>}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.approveButton, actionLoading === booking.id && { opacity: 0.5 }]}
                              onPress={() => handlePaymentAction(booking.id, "approved")}
                              disabled={actionLoading === booking.id}
                            >
                              {actionLoading === booking.id
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <><Ionicons name="checkmark-circle" size={16} color="#fff" /><Text style={styles.approveButtonText}>Approve Payment</Text></>}
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      {ps === "approved" && (
                        <View style={styles.approvedInfo}>
                          <Ionicons name="checkmark-circle" size={15} color="#4CAF50" />
                          <Text style={styles.approvedInfoText}>Payment approved — tenant's QR code is now active.</Text>
                        </View>
                      )}
                      {ps === "rejected" && (
                        <View style={styles.rejectedInfo}>
                          <Ionicons name="close-circle" size={15} color="#F44336" />
                          <Text style={styles.rejectedInfoText}>Payment rejected — tenant has been notified.</Text>
                        </View>
                      )}
                    </View>
                  );
                }

                if (cs === "rejected") {
                  return (
                    <View>
                      <TouchableOpacity
                        style={[styles.reviewContractBtn, { marginBottom: 10 }]}
                        onPress={() => setContractViewModal({ booking })}
                        activeOpacity={0.8}
                      >
                        <View style={styles.reviewContractIcon}>
                          <Ionicons name="document-text" size={22} color="#1D4ED8" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewContractTitle}>View Signed Lease Agreement</Text>
                          <Text style={styles.reviewContractSub}>Contract rejected — tap to review</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#1D4ED8" />
                      </TouchableOpacity>
                      <View style={styles.rejectedInfo}>
                        <Ionicons name="close-circle" size={15} color="#F44336" />
                        <Text style={styles.rejectedInfoText}>Contract rejected — tenant has been notified.</Text>
                      </View>
                    </View>
                  );
                }

                return null;
              })()}

              {booking.status === "rejected" && (
                <View style={styles.rejectedInfo}>
                  <Ionicons name="close-circle" size={15} color="#F44336" />
                  <Text style={styles.rejectedInfoText}>Booking has been rejected.</Text>
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Approve Booking Confirmation Modal ────────────────── */}
      {approveModal && (
        <Modal visible transparent animationType="slide" onRequestClose={() => !approveModal.approving && setApproveModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Approve Booking</Text>
              <Text style={styles.modalSubtitle}>
                Approving this booking will notify the tenant. They will receive a pre-filled lease contract template to review and digitally sign.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setApproveModal(null)}
                  disabled={approveModal.approving}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalApproveBtn, approveModal.approving && { opacity: 0.5 }]}
                  onPress={handleApproveBooking}
                  disabled={approveModal.approving}
                >
                  {approveModal.approving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.modalApproveBtnText}>Confirm Approval</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Contract view modal ─────────────────────────────────── */}
      {renderContractViewModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: "#f5f5f5" },
  header:               { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  backButton:           { marginRight: 12, padding: 4 },
  headerTextContainer:  { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:          { fontSize: 22, fontWeight: "bold", color: "#333" },
  pendingBadge:         { backgroundColor: "#FF9800", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  pendingBadgeText:     { color: "#fff", fontSize: 12, fontWeight: "600" },
  refreshButton:        { padding: 4 },
  filterTabs:           { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e0e0e0", gap: 6 },
  filterTab:            { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  filterTabActive:      { backgroundColor: "#007AFF" },
  filterTabText:        { fontSize: 12, fontWeight: "600", color: "#666" },
  filterTabTextActive:  { color: "#fff" },
  list:                 { flex: 1, padding: 14 },
  emptyState:           { alignItems: "center", paddingVertical: 80 },
  emptyStateText:       { fontSize: 16, color: "#999", marginTop: 12 },
  card:                 { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  statusBadge:          { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, gap: 5, marginBottom: 14 },
  statusBadgeText:      { fontSize: 11, fontWeight: "bold", color: "#fff" },
  tenantSection:        { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 12 },
  tenantAvatar:         { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center" },
  tenantName:           { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 2 },
  contactText:          { fontSize: 12, color: "#666", marginTop: 1 },
  divider:              { height: 1, backgroundColor: "#f0f0f0", marginVertical: 10 },
  sectionLabel:         { fontSize: 11, fontWeight: "700", color: "#007AFF", marginBottom: 8, letterSpacing: 0.5 },
  propertyName:         { fontSize: 15, fontWeight: "bold", color: "#333", marginBottom: 4 },
  addressRow:           { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  propertyAddress:      { fontSize: 12, color: "#666", flex: 1 },
  detailsGrid:          { gap: 8 },
  detailRow:            { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel:          { fontSize: 13, color: "#666", width: 100 },
  detailValue:          { fontSize: 13, fontWeight: "600", color: "#333", flex: 1 },
  notesBox:             { backgroundColor: "#f9f9f9", padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: "#007AFF", marginTop: 10 },
  notesText:            { fontSize: 13, color: "#666", lineHeight: 19 },
  submittedDate:        { fontSize: 11, color: "#999", marginTop: 10, marginBottom: 12 },
  actionButtons:        { flexDirection: "row", gap: 10 },
  approveButton:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#4CAF50", paddingVertical: 13, borderRadius: 10, gap: 6 },
  approveButtonText:    { color: "#fff", fontSize: 15, fontWeight: "700" },
  rejectButton:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F44336", paddingVertical: 13, borderRadius: 10, gap: 6 },
  rejectButtonText:     { color: "#fff", fontSize: 15, fontWeight: "700" },
  approvedInfo:         { flexDirection: "row", alignItems: "center", backgroundColor: "#E8F5E9", padding: 10, borderRadius: 8, gap: 8 },
  approvedInfoText:     { flex: 1, fontSize: 12, color: "#2E7D32" },
  rejectedInfo:         { flexDirection: "row", alignItems: "center", backgroundColor: "#FFEBEE", padding: 10, borderRadius: 8, gap: 8 },
  rejectedInfoText:     { flex: 1, fontSize: 12, color: "#C62828" },
  contractBanner:       { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", padding: 10, borderRadius: 8, gap: 8, marginBottom: 10, borderWidth: 1, borderColor: "#BFDBFE" },
  contractBannerText:   { flex: 1, fontSize: 12, color: "#1D4ED8", fontWeight: "600" },
  paymentBanner:        { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", padding: 10, borderRadius: 8, gap: 8, marginBottom: 10, borderWidth: 1, borderColor: "#BFDBFE" },
  paymentBannerText:    { flex: 1, fontSize: 12, color: "#1D4ED8", fontWeight: "600" },
  photosRow:            { flexDirection: "row", gap: 12, marginBottom: 12 },
  photoBlock:           { flex: 1, alignItems: "center" },
  photoBlockLabel:      { fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 6 },
  contractPhoto:        { width: "100%", aspectRatio: 1, borderRadius: 10, backgroundColor: "#F1F5F9" },
  contractActions:      { flexDirection: "row", gap: 10 },
  // Signature display
  signatureBox:         { marginBottom: 12 },
  signaturePreview:     { width: "100%", aspectRatio: 3, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0" },
  contractPhotoEmpty:   { alignItems: "center", justifyContent: "center" },
  openContractBtn:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EFF6FF", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  openContractBtnText:  { flex: 1, fontSize: 14, color: "#1D4ED8", fontWeight: "600" as const },
  contractDocPreview:   { width: "100%", height: 480, borderRadius: 10, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  signedDocImage:       { width: "100%", height: 640, borderRadius: 10, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", marginTop: 6 },
  // Review contract button (in card)
  reviewContractBtn:    { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#EFF6FF", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#BFDBFE", marginBottom: 12 },
  reviewContractIcon:   { width: 40, height: 40, borderRadius: 10, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  reviewContractTitle:  { fontSize: 13, fontWeight: "700", color: "#1D4ED8", marginBottom: 2 },
  reviewContractSub:    { fontSize: 11, color: "#3B82F6" },
  // Upload modal
  modalOverlay:         { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox:             { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
  modalTitle:           { fontSize: 18, fontWeight: "bold", color: "#1a1a1a", marginBottom: 8 },
  modalSubtitle:        { fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 19 },
  modalActions:         { flexDirection: "row", gap: 10 },
  modalCancelBtn:       { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: "center", borderWidth: 1.5, borderColor: "#ccc" },
  modalCancelBtnText:   { fontSize: 14, fontWeight: "600", color: "#666" },
  modalApproveBtn:      { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#4CAF50", paddingVertical: 13, borderRadius: 10, gap: 6 },
  modalApproveBtnText:  { color: "#fff", fontSize: 14, fontWeight: "700" },
});

// ── Contract view modal styles ────────────────────────────────────────────────
const CV = StyleSheet.create({
  root:          { flex: 1, backgroundColor: "#F8FAFC" },
  topBar:        { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 12 },
  topBarTitle:   { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  topBarSub:     { fontSize: 11, color: "#64748B", marginTop: 1 },
  closeBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  scroll:        { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 20 },

  contractDoc:   { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 12, overflow: "hidden" },
  header:        { backgroundColor: "#1D4ED8", paddingVertical: 22, paddingHorizontal: 20, alignItems: "center", gap: 4 },
  headerTitle:   { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 1.5 },
  headerRef:     { fontSize: 11, color: "#BFDBFE", fontWeight: "600", marginTop: 2 },
  headerDate:    { fontSize: 11, color: "#BFDBFE" },
  preamble:      { fontSize: 12, color: "#374151", lineHeight: 19, padding: 14, paddingBottom: 4 },
  bold:          { fontWeight: "700", color: "#0F172A" },

  section:       { borderTopWidth: 1, borderTopColor: "#F1F5F9", marginHorizontal: 14, paddingVertical: 10 },
  sectionTitle:  { fontSize: 10, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1.2, marginBottom: 8, textTransform: "uppercase" },
  fieldRow:      { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  fieldLabel:    { width: 130, fontSize: 11, color: "#64748B", fontWeight: "600" },
  fieldValue:    { flex: 1, fontSize: 12, color: "#0F172A" },
  clause:        { marginBottom: 10 },
  clauseTitle:   { fontSize: 11, fontWeight: "700", color: "#0F172A", marginBottom: 3 },
  clauseBody:    { fontSize: 11, color: "#475569", lineHeight: 17 },

  // Signature section
  sigSection:    { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", padding: 14, marginBottom: 14 },
  sigLabelRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sigLabel:      { fontSize: 11, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1, textTransform: "uppercase" },
  sigImage:      { width: "100%", aspectRatio: 800 / 300, borderRadius: 10, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  sigNote:       { fontSize: 11, color: "#64748B", marginTop: 8, textAlign: "center" },

  // Action buttons
  actions:       { flexDirection: "row", gap: 10, marginBottom: 16 },
  rejectBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F44336", paddingVertical: 14, borderRadius: 12, gap: 6 },
  rejectBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  approveBtn:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#4CAF50", paddingVertical: 14, borderRadius: 12, gap: 6 },
  approveBtnText:{ color: "#fff", fontSize: 14, fontWeight: "700" },
});
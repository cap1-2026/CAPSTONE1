import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

// ─── helpers ───────────────────────────────────────────────────────────────
function showAlert(title: string, msg?: string) {
  if (Platform.OS === "web") window.alert(msg ? `${title}\n\n${msg}` : title);
  else Alert.alert(title, msg);
}

// ─── types ─────────────────────────────────────────────────────────────────
interface Booking {
  id: number;
  property_name: string;
  property_address: string;
  property_price: number;
  property_deposit: number;
  move_in: string;
  lease_duration: string;
  occupants: number;
  status: "pending" | "approved" | "rejected";
  contract_status: "none" | "submitted" | "approved" | "rejected";
  payment_status?: "none" | "paid" | "pending_owner_approval" | "approved";
  created_at: string;
}

type PayMethod = "gcash" | "card" | "bank_transfer" | "cash";

interface ContractState {
  facePhoto: any;
  idPhoto: any;
  agreed: boolean;
  submitting: boolean;
}

interface PayState {
  method: PayMethod | null;
  gcashNumber: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCVV: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  submitting: boolean;
  done: boolean;
  txId: string;
}

const defaultContract = (): ContractState => ({
  facePhoto: null, idPhoto: null, agreed: false, submitting: false,
});
const defaultPay = (): PayState => ({
  method: null, gcashNumber: "", cardName: "", cardNumber: "",
  cardExpiry: "", cardCVV: "", bankName: "", accountNumber: "",
  accountName: "", submitting: false, done: false, txId: "",
});

// ─── step resolution ───────────────────────────────────────────────────────
type StepId = 0 | 1 | 2 | 3; // 0=Booking, 1=Contract, 2=Payment, 3=QR

function activeStep(b: Booking, payDone: boolean): StepId {
  if (b.status !== "approved") return 0;
  const cs = b.contract_status ?? "none";
  if (cs !== "approved") return 1;
  if (!payDone) return 2;
  return 3;
}

// ─── main component ────────────────────────────────────────────────────────
export default function TenantFlowPage() {
  const router = useRouter();
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [userId, setUserId]       = useState<number | null>(null);
  const [tenantName, setTenantName] = useState("Tenant");

  const [contracts, setContracts] = useState<Record<number, ContractState>>({});
  const [payments,  setPayments]  = useState<Record<number, PayState>>({});

  const fetchBookings = useCallback(async (uid: number) => {
    try {
      const res  = await fetch(`${API_ENDPOINTS.GET_BOOKINGS}?tenant_id=${uid}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") setBookings(data.data ?? []);
    } catch {
      showAlert("Error", "Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    UserStorage.getUser("tenant").then((user) => {
      if (user) {
        setUserId(user.user_id);
        setTenantName(user.fullname ?? "Tenant");
        fetchBookings(user.user_id);
      } else {
        setLoading(false);
      }
    });
  }, [fetchBookings]);

  // ── contract helpers ──────────────────────────────────────────────────────
  function getContract(id: number): ContractState {
    return contracts[id] ?? defaultContract();
  }
  function setContractField<K extends keyof ContractState>(
    id: number, field: K, value: ContractState[K],
  ) {
    setContracts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? defaultContract()), [field]: value },
    }));
  }

  async function pickPhoto(bookingId: number, type: "face" | "id") {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showAlert("Permission needed", "Allow photo access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images" as any, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setContractField(bookingId, type === "face" ? "facePhoto" : "idPhoto", result.assets[0]);
    }
  }

  async function appendPhoto(form: FormData, key: string, photo: any) {
    if (!photo) return;
    if (Platform.OS === "web") {
      const blob = await fetch(photo.uri).then((r) => r.blob());
      form.append(key, blob, `${key}_${Date.now()}.jpg`);
    } else {
      (form as any).append(key, { uri: photo.uri, name: photo.fileName || `${key}.jpg`, type: photo.mimeType || "image/jpeg" });
    }
  }

  async function submitContract(b: Booking) {
    const c = getContract(b.id);
    if (!c.agreed)     { showAlert("Agreement Required", "Please agree to the contract terms."); return; }
    if (!c.facePhoto)  { showAlert("Photo Required", "Upload a selfie for identity verification."); return; }
    if (!c.idPhoto)    { showAlert("ID Required", "Upload a photo of your valid ID."); return; }

    setContractField(b.id, "submitting", true);
    try {
      const form = new FormData();
      form.append("booking_id", String(b.id));
      await appendPhoto(form, "face_photo", c.facePhoto);
      await appendPhoto(form, "id_photo",   c.idPhoto);
      const res  = await fetch(API_ENDPOINTS.SUBMIT_CONTRACT, { method: "POST", body: form });
      const data = await res.json();
      if (data.status === "success") {
        setBookings((prev) =>
          prev.map((bk) => bk.id === b.id ? { ...bk, contract_status: "submitted" } : bk),
        );
        showAlert("Submitted!", "Contract sent for owner review.");
      } else {
        showAlert("Failed", data.message || "Please try again.");
      }
    } catch {
      showAlert("Connection Error", "Cannot reach the server.");
    } finally {
      setContractField(b.id, "submitting", false);
    }
  }

  // ── payment helpers ───────────────────────────────────────────────────────
  function getPayment(id: number): PayState {
    return payments[id] ?? defaultPay();
  }
  function setPayField<K extends keyof PayState>(id: number, field: K, value: PayState[K]) {
    setPayments((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? defaultPay()), [field]: value },
    }));
  }

  async function submitPayment(b: Booking) {
    const p = getPayment(b.id);
    if (!p.method) { showAlert("Select Method", "Choose a payment method."); return; }
    const deposit = Number(b.property_deposit) || Number(b.property_price);
    setPayField(b.id, "submitting", true);
    try {
      const res = await fetch(API_ENDPOINTS.PAYMENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: b.id,
          amount: deposit,
          method: p.method,
          type: "security_deposit",
          escrow: true,
        }),
      });
      const data = await res.json();
      const txId = data.transaction_id ?? `ESC-${Date.now()}`;
      setPayments((prev) => ({
        ...prev,
        [b.id]: { ...(prev[b.id] ?? defaultPay()), submitting: false, done: true, txId },
      }));
      setBookings((prev) =>
        prev.map((bk) => bk.id === b.id ? { ...bk, payment_status: "pending_owner_approval" } : bk),
      );
    } catch {
      showAlert("Connection Error", "Payment failed. Try again.");
      setPayField(b.id, "submitting", false);
    }
  }

  // ── render helpers ────────────────────────────────────────────────────────
  function StepDot({ active, done, rejected }: { active?: boolean; done?: boolean; rejected?: boolean }) {
    const bg = rejected ? "#DC2626" : done ? "#16A34A" : active ? "#2563EB" : "#E2E8F0";
    const icon = rejected ? "close" : done ? "checkmark" : active ? "ellipse" : "ellipse";
    const iconColor = active || done || rejected ? "#fff" : "#94A3B8";
    return (
      <View style={[S.dot, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={13} color={iconColor} />
      </View>
    );
  }

  function renderBookingStep(b: Booking, step: StepId) {
    const isActive = step === 0;
    const isDone   = step > 0;
    const deposit  = Number(b.property_deposit) || Number(b.property_price);

    return (
      <View style={S.stepRow}>
        <View style={S.stepLeft}>
          <StepDot active={isActive} done={isDone} />
          <View style={S.connector} />
        </View>
        <View style={[S.stepContent, isDone && S.stepDone, isActive && S.stepActive]}>
          <View style={S.stepTitleRow}>
            <Text style={S.stepLabel}>Step 1</Text>
            <View style={[S.badge, isDone ? S.badgeDone : S.badgeActive]}>
              <Text style={S.badgeText}>{isDone ? "APPROVED" : b.status === "rejected" ? "REJECTED" : "PENDING"}</Text>
            </View>
          </View>
          <Text style={S.stepTitle}>Booking Request</Text>

          {b.status === "rejected" ? (
            <View style={S.alertBox}>
              <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
              <Text style={[S.alertText, { color: "#DC2626" }]}>Your booking was not approved.</Text>
              <TouchableOpacity onPress={() => router.push("/tenant/browse-properties" as any)}>
                <Text style={S.linkText}>Browse other properties →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={S.infoGrid}>
              {[
                { icon: "home-outline",     label: "Property",  value: b.property_name },
                { icon: "location-outline", label: "Address",   value: b.property_address },
                { icon: "calendar-outline", label: "Move-in",   value: b.move_in },
                { icon: "time-outline",     label: "Duration",  value: b.lease_duration },
                { icon: "cash-outline",     label: "Monthly",   value: `₱${Number(b.property_price).toLocaleString()}` },
                { icon: "shield-outline",   label: "Deposit",   value: `₱${deposit.toLocaleString()}` },
              ].map((row, i) => (
                <View key={i} style={S.infoRow}>
                  <Ionicons name={row.icon as any} size={14} color="#64748B" />
                  <Text style={S.infoLabel}>{row.label}</Text>
                  <Text style={S.infoValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          )}

          {isActive && b.status === "pending" && (
            <View style={S.pendingBox}>
              <ActivityIndicator size="small" color="#D97706" />
              <Text style={S.pendingText}>Waiting for owner approval…</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  function renderContractStep(b: Booking, step: StepId) {
    const cs       = b.contract_status ?? "none";
    const isActive = step === 1;
    const isDone   = cs === "approved";
    const isReview = cs === "submitted";
    const isRejected = cs === "rejected";
    const locked   = step < 1;
    const c        = getContract(b.id);

    return (
      <View style={S.stepRow}>
        <View style={S.stepLeft}>
          <StepDot active={isActive} done={isDone} rejected={isRejected} />
          <View style={S.connector} />
        </View>
        <View style={[S.stepContent, isDone && S.stepDone, isActive && S.stepActive, locked && S.stepLocked]}>
          <View style={S.stepTitleRow}>
            <Text style={S.stepLabel}>Step 2</Text>
            {isDone   && <View style={[S.badge, S.badgeDone]}><Text style={S.badgeText}>APPROVED</Text></View>}
            {isReview && <View style={[S.badge, S.badgeReview]}><Text style={S.badgeText}>IN REVIEW</Text></View>}
            {isRejected && <View style={[S.badge, S.badgeRejected]}><Text style={S.badgeText}>REJECTED</Text></View>}
            {locked   && <View style={[S.badge, S.badgeLocked]}><Text style={S.badgeText}>LOCKED</Text></View>}
          </View>
          <Text style={[S.stepTitle, locked && S.stepTitleLocked]}>Lease Contract</Text>

          {locked && (
            <Text style={S.lockedNote}>Complete Step 1 first to unlock.</Text>
          )}

          {isDone && (
            <View style={S.doneBox}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
              <Text style={S.doneText}>Contract approved by owner. You may proceed to payment.</Text>
            </View>
          )}

          {isReview && (
            <View style={S.reviewBox}>
              <ActivityIndicator size="small" color="#D97706" />
              <Text style={S.reviewText}>Contract submitted — owner is reviewing your photos.</Text>
            </View>
          )}

          {isRejected && (
            <View style={[S.alertBox, { borderColor: "#FCA5A5" }]}>
              <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
              <Text style={[S.alertText, { color: "#DC2626" }]}>Contract was rejected. Please contact the owner.</Text>
            </View>
          )}

          {isActive && cs === "none" && (
            <>
              {/* Contract Summary */}
              <View style={S.contractSummary}>
                <Text style={S.contractSummaryTitle}>RESIDENTIAL LEASE AGREEMENT</Text>
                <Text style={S.contractRef}>Ref: PF-{String(b.id).padStart(6, "0")}</Text>
                <View style={S.summaryRow}><Text style={S.sumLabel}>Tenant</Text><Text style={S.sumValue}>{tenantName}</Text></View>
                <View style={S.summaryRow}><Text style={S.sumLabel}>Property</Text><Text style={S.sumValue}>{b.property_name}</Text></View>
                <View style={S.summaryRow}><Text style={S.sumLabel}>Monthly Rent</Text><Text style={[S.sumValue, { color: "#059669" }]}>₱{Number(b.property_price).toLocaleString()}</Text></View>
                <View style={S.summaryRow}><Text style={S.sumLabel}>Move-In</Text><Text style={S.sumValue}>{b.move_in}</Text></View>
                <View style={S.summaryRow}><Text style={S.sumLabel}>Duration</Text><Text style={S.sumValue}>{b.lease_duration}</Text></View>
              </View>

              {/* Terms notice */}
              <View style={S.termsNotice}>
                <MaterialCommunityIcons name="file-document-outline" size={15} color="#2563EB" />
                <Text style={S.termsNoticeText}>
                  By submitting, you agree to: pay rent by the 1st of each month, maintain the property, and follow a 30-day
                  notice for termination. Full terms apply per PadFinder's Rental Agreement policy.
                </Text>
              </View>

              {/* Identity Verification */}
              <Text style={S.photoSectionTitle}>IDENTITY VERIFICATION</Text>

              <Text style={S.photoLabel}>Selfie / Face Photo <Text style={{ color: "#DC2626" }}>*</Text></Text>
              <TouchableOpacity style={[S.photoBox, c.facePhoto && S.photoBoxDone]} onPress={() => pickPhoto(b.id, "face")}>
                {c.facePhoto ? (
                  <View style={S.photoRow}>
                    <Image source={{ uri: c.facePhoto.uri }} style={S.photoThumb} />
                    <View>
                      <Text style={S.photoOk}>✓ Face Photo Uploaded</Text>
                      <Text style={S.photoChange}>Tap to change</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Ionicons name="person-circle-outline" size={26} color="#94A3B8" />
                    <Text style={S.photoHint}>Tap to upload selfie</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={[S.photoLabel, { marginTop: 10 }]}>Valid Government ID <Text style={{ color: "#DC2626" }}>*</Text></Text>
              <TouchableOpacity style={[S.photoBox, c.idPhoto && S.photoBoxDone]} onPress={() => pickPhoto(b.id, "id")}>
                {c.idPhoto ? (
                  <View style={S.photoRow}>
                    <Image source={{ uri: c.idPhoto.uri }} style={S.photoThumb} />
                    <View>
                      <Text style={S.photoOk}>✓ ID Photo Uploaded</Text>
                      <Text style={S.photoChange}>Tap to change</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Ionicons name="card-outline" size={26} color="#94A3B8" />
                    <Text style={S.photoHint}>Passport, Driver's License, PhilSys…</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Agreement */}
              <TouchableOpacity
                style={S.agreeRow}
                onPress={() => setContractField(b.id, "agreed", !c.agreed)}
                activeOpacity={0.7}
              >
                <View style={[S.checkbox, c.agreed && S.checkboxOn]}>
                  {c.agreed && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
                <Text style={S.agreeText}>
                  I, <Text style={{ fontWeight: "700" }}>{tenantName}</Text>, have read and agree to all lease terms.
                </Text>
              </TouchableOpacity>

              {/* Submit */}
              <TouchableOpacity
                style={[S.cta, (!c.agreed || !c.facePhoto || !c.idPhoto) && S.ctaDim]}
                onPress={() => submitContract(b)}
                disabled={c.submitting}
              >
                {c.submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={16} color="#fff" />
                    <Text style={S.ctaText}>Submit Contract for Review</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  function renderPaymentStep(b: Booking, step: StepId) {
    const isActive = step === 2;
    const locked   = step < 2;
    const p        = getPayment(b.id);
    const isDone   = p.done || ["paid","pending_owner_approval","approved"].includes(b.payment_status ?? "none");
    const deposit  = Number(b.property_deposit) || Number(b.property_price);

    const payMethods: { id: PayMethod; icon: string; label: string; color: string }[] = [
      { id: "gcash",         icon: "logo-google",       label: "GCash",         color: "#007BFF" },
      { id: "card",          icon: "card-outline",      label: "Credit / Debit Card", color: "#6366F1" },
      { id: "bank_transfer", icon: "business-outline",  label: "Bank Transfer", color: "#0F766E" },
      { id: "cash",          icon: "cash-outline",      label: "Cash on Hand",  color: "#D97706" },
    ];

    return (
      <View style={S.stepRow}>
        <View style={S.stepLeft}>
          <StepDot active={isActive} done={isDone} />
          <View style={S.connector} />
        </View>
        <View style={[S.stepContent, isDone && S.stepDone, isActive && S.stepActive, locked && S.stepLocked]}>
          <View style={S.stepTitleRow}>
            <Text style={S.stepLabel}>Step 3</Text>
            {isDone  && <View style={[S.badge, S.badgeDone]}><Text style={S.badgeText}>PAID</Text></View>}
            {locked  && <View style={[S.badge, S.badgeLocked]}><Text style={S.badgeText}>LOCKED</Text></View>}
          </View>
          <Text style={[S.stepTitle, locked && S.stepTitleLocked]}>Security Deposit Payment</Text>

          {locked && <Text style={S.lockedNote}>Complete Step 2 first to unlock.</Text>}

          {isDone && (
            <View style={S.doneBox}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
              <Text style={S.doneText}>
                {b.payment_status === "approved"
                  ? "Payment approved by owner. Check Step 4 for your QR code."
                  : "Payment submitted. Waiting for owner to approve..."}
              </Text>
            </View>
          )}

          {isActive && !isDone && (
            <>
              <View style={S.amountBox}>
                <Text style={S.amountLabel}>Security Deposit Due</Text>
                <Text style={S.amountValue}>₱{deposit.toLocaleString()}</Text>
                <Text style={S.amountNote}>Held in PadFinder Escrow • Refundable</Text>
              </View>

              <Text style={S.methodTitle}>Select Payment Method</Text>
              <View style={S.methodGrid}>
                {payMethods.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[S.methodBtn, p.method === m.id && { borderColor: m.color, backgroundColor: m.color + "14" }]}
                    onPress={() => setPayField(b.id, "method", m.id)}
                  >
                    <Ionicons name={m.icon as any} size={20} color={p.method === m.id ? m.color : "#64748B"} />
                    <Text style={[S.methodLabel, p.method === m.id && { color: m.color, fontWeight: "700" }]}>{m.label}</Text>
                    {p.method === m.id && <Ionicons name="checkmark-circle" size={14} color={m.color} />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Method-specific fields */}
              {p.method === "gcash" && (
                <View style={S.fieldGroup}>
                  <Text style={S.fieldLabel}>GCash Number</Text>
                  <TextInput style={S.input} placeholder="09XXXXXXXXX" keyboardType="phone-pad"
                    value={p.gcashNumber} onChangeText={(v) => setPayField(b.id, "gcashNumber", v)} />
                </View>
              )}
              {p.method === "card" && (
                <View style={S.fieldGroup}>
                  <Text style={S.fieldLabel}>Cardholder Name</Text>
                  <TextInput style={S.input} placeholder="Full name on card"
                    value={p.cardName} onChangeText={(v) => setPayField(b.id, "cardName", v)} />
                  <Text style={[S.fieldLabel, { marginTop: 8 }]}>Card Number</Text>
                  <TextInput style={S.input} placeholder="XXXX XXXX XXXX XXXX" keyboardType="number-pad"
                    value={p.cardNumber} onChangeText={(v) => setPayField(b.id, "cardNumber", v)} />
                  <View style={S.fieldRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={S.fieldLabel}>Expiry</Text>
                      <TextInput style={S.input} placeholder="MM/YY"
                        value={p.cardExpiry} onChangeText={(v) => setPayField(b.id, "cardExpiry", v)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.fieldLabel}>CVV</Text>
                      <TextInput style={S.input} placeholder="XXX" keyboardType="number-pad" secureTextEntry
                        value={p.cardCVV} onChangeText={(v) => setPayField(b.id, "cardCVV", v)} />
                    </View>
                  </View>
                </View>
              )}
              {p.method === "bank_transfer" && (
                <View style={S.fieldGroup}>
                  <Text style={S.fieldLabel}>Bank Name</Text>
                  <TextInput style={S.input} placeholder="e.g. BDO, BPI, Metrobank"
                    value={p.bankName} onChangeText={(v) => setPayField(b.id, "bankName", v)} />
                  <Text style={[S.fieldLabel, { marginTop: 8 }]}>Account Number</Text>
                  <TextInput style={S.input} placeholder="Account number" keyboardType="number-pad"
                    value={p.accountNumber} onChangeText={(v) => setPayField(b.id, "accountNumber", v)} />
                  <Text style={[S.fieldLabel, { marginTop: 8 }]}>Account Name</Text>
                  <TextInput style={S.input} placeholder="Account holder name"
                    value={p.accountName} onChangeText={(v) => setPayField(b.id, "accountName", v)} />
                </View>
              )}
              {p.method === "cash" && (
                <View style={S.cashNotice}>
                  <Ionicons name="information-circle-outline" size={16} color="#D97706" />
                  <Text style={S.cashNoticeText}>
                    Pay ₱{deposit.toLocaleString()} in cash directly to the owner. Click "Confirm Payment" once you have paid.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[S.cta, { backgroundColor: "#1D4ED8" }, !p.method && S.ctaDim]}
                onPress={() => submitPayment(b)}
                disabled={p.submitting || !p.method}
              >
                {p.submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                    <Text style={S.ctaText}>Confirm Payment — ₱{deposit.toLocaleString()}</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  function renderQRStep(b: Booking, step: StepId) {
    const isActive   = step === 3;
    const locked     = step < 3;
    const payStatus  = b.payment_status ?? "none";
    const isApproved = payStatus === "approved";
    const isPending  = ["paid", "pending_owner_approval"].includes(payStatus);
    const deposit    = Number(b.property_deposit) || Number(b.property_price);

    const qrData = [
      "PADFINDER TENANT QR",
      `Ref: PF-${String(b.id).padStart(6, "0")}`,
      `Tenant: ${tenantName}`,
      `Property: ${b.property_name}`,
      `Address: ${b.property_address}`,
      `Deposit Paid: PHP ${deposit.toLocaleString()}`,
      `Monthly Rent: PHP ${Number(b.property_price).toLocaleString()}`,
      `Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
      "Status: VERIFIED",
    ].join("\n");
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(qrData)}`;

    return (
      <View style={[S.stepRow, { marginBottom: 0 }]}>
        <View style={S.stepLeft}>
          <StepDot active={isActive && !isApproved} done={isApproved} />
        </View>
        <View style={[S.stepContent, (isActive || isApproved) && S.stepActive, locked && S.stepLocked, isApproved && S.stepDone, { marginBottom: 0 }]}>
          <View style={S.stepTitleRow}>
            <Text style={S.stepLabel}>Step 4</Text>
            {locked    && <View style={[S.badge, S.badgeLocked]}><Text style={S.badgeText}>LOCKED</Text></View>}
            {isActive && isPending && !isApproved && <View style={[S.badge, S.badgeReview]}><Text style={S.badgeText}>AWAITING</Text></View>}
            {isApproved && <View style={[S.badge, S.badgeDone]}><Text style={S.badgeText}>ACTIVE</Text></View>}
          </View>
          <Text style={[S.stepTitle, locked && S.stepTitleLocked]}>Tenant QR Code</Text>

          {locked && <Text style={S.lockedNote}>Complete payment to unlock your QR access pass.</Text>}

          {isActive && isPending && !isApproved && (
            <View style={S.qrWaiting}>
              <ActivityIndicator size="small" color="#D97706" />
              <Text style={S.qrWaitTitle}>Awaiting Owner Approval</Text>
              <Text style={S.qrWaitNote}>
                Your payment has been submitted. The owner will review and approve your payment to generate your QR access pass.
              </Text>
            </View>
          )}

          {isApproved && (
            <View style={S.qrApproved}>
              <View style={S.qrApprovalBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={S.qrApprovalText}>Payment approved — present this QR to your owner</Text>
              </View>
              <View style={S.qrCard}>
                <Image source={{ uri: qrUrl }} style={S.qrImage} resizeMode="contain" />
                <Text style={S.qrCardRef}>PF-{String(b.id).padStart(6, "0")}</Text>
                <Text style={S.qrCardProp}>{b.property_name}</Text>
              </View>
              <View style={S.qrInfoGrid}>
                {[
                  { label: "Tenant",       value: tenantName },
                  { label: "Property",     value: b.property_name },
                  { label: "Deposit Paid", value: `₱${deposit.toLocaleString()}` },
                  { label: "Monthly Rent", value: `₱${Number(b.property_price).toLocaleString()}` },
                ].map((row, i) => (
                  <View key={i} style={S.qrInfoRow}>
                    <Text style={S.qrInfoLabel}>{row.label}</Text>
                    <Text style={S.qrInfoValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  // ── main render ───────────────────────────────────────────────────────────
  return (
    <View style={S.container}>
      <View style={S.header}>
        <View style={{ flex: 1 }}>
          <Text style={S.headerTitle}>My Rental Progress</Text>
          <Text style={S.headerSub}>Step-by-step tenant journey</Text>
        </View>
        <TouchableOpacity
          style={S.refreshBtn}
          onPress={() => { if (userId) { setLoading(true); fetchBookings(userId); } }}
        >
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}>
        {loading ? (
          <View style={S.center}>
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text style={S.centerText}>Loading…</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={S.center}>
            <MaterialCommunityIcons name="home-search-outline" size={60} color="#CBD5E1" />
            <Text style={S.emptyTitle}>No Bookings Yet</Text>
            <Text style={S.emptySub}>Browse properties and submit a booking to start.</Text>
            <TouchableOpacity style={S.browseCta} onPress={() => router.push("/tenant/browse-properties" as any)}>
              <Text style={S.browseCtaText}>Browse Properties</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bookings.map((b) => {
            const p = getPayment(b.id);
            const step = activeStep(b, p.done || ["paid","pending_owner_approval","approved"].includes(b.payment_status ?? "none"));
            return (
              <View key={b.id} style={S.bookingCard}>
                {/* Card header */}
                <View style={S.cardTop}>
                  <View style={S.cardIcon}>
                    <Ionicons name="home" size={20} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.cardPropName}>{b.property_name}</Text>
                    <Text style={S.cardPropAddr}>{b.property_address}</Text>
                  </View>
                  <View style={S.stepPill}>
                    <Text style={S.stepPillText}>Step {step + 1} / 4</Text>
                  </View>
                </View>

                <View style={S.stepsContainer}>
                  {renderBookingStep(b, step)}
                  {renderContractStep(b, step)}
                  {renderPaymentStep(b, step)}
                  {renderQRStep(b, step)}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#F1F5F9" },
  header:       { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerTitle:  { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerSub:    { fontSize: 12, color: "#64748B", marginTop: 2 },
  refreshBtn:   { width: 34, height: 34, borderRadius: 8, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  scroll:       { flex: 1 },
  scrollContent:{ padding: 14, paddingBottom: 40 },

  center:       { alignItems: "center", paddingVertical: 80, gap: 10 },
  centerText:   { color: "#64748B", marginTop: 10 },
  emptyTitle:   { fontSize: 18, fontWeight: "700", color: "#94A3B8", marginTop: 4 },
  emptySub:     { fontSize: 14, color: "#CBD5E1", textAlign: "center", maxWidth: 260 },
  browseCta:    { backgroundColor: "#1D4ED8", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  browseCtaText:{ color: "#fff", fontWeight: "700", fontSize: 14 },

  bookingCard:  { backgroundColor: "#fff", borderRadius: 16, marginBottom: 18, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, overflow: "hidden" },
  cardTop:      { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  cardIcon:     { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  cardPropName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  cardPropAddr: { fontSize: 11, color: "#64748B", marginTop: 1 },
  stepPill:     { backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stepPillText: { fontSize: 11, fontWeight: "700", color: "#1D4ED8" },

  stepsContainer: { padding: 14, paddingTop: 16 },

  // Step layout
  stepRow:      { flexDirection: "row", gap: 12, marginBottom: 14 },
  stepLeft:     { alignItems: "center", width: 24 },
  dot:          { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  connector:    { flex: 1, width: 2, backgroundColor: "#E2E8F0", marginTop: 4, minHeight: 20 },

  stepContent:  { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FAFAFA", marginBottom: 6 },
  stepDone:     { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  stepActive:   { backgroundColor: "#fff", borderColor: "#BFDBFE", shadowColor: "#2563EB", shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  stepLocked:   { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0", opacity: 0.65 },

  stepTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  stepLabel:    { fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 0.8 },
  stepTitle:    { fontSize: 15, fontWeight: "800", color: "#0F172A", marginBottom: 10 },
  stepTitleLocked: { color: "#94A3B8" },

  badge:        { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText:    { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  badgeDone:    { backgroundColor: "#16A34A" },
  badgeActive:  { backgroundColor: "#2563EB" },
  badgeReview:  { backgroundColor: "#D97706" },
  badgeRejected:{ backgroundColor: "#DC2626" },
  badgeLocked:  { backgroundColor: "#94A3B8" },

  lockedNote:   { fontSize: 12, color: "#94A3B8", fontStyle: "italic" },

  alertBox:     { borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FEF2F2", borderRadius: 8, padding: 10, gap: 6 },
  alertText:    { fontSize: 12, flex: 1 },
  linkText:     { fontSize: 12, color: "#2563EB", fontWeight: "700", marginTop: 4 },

  infoGrid:     { gap: 6 },
  infoRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel:    { fontSize: 12, color: "#64748B", width: 64 },
  infoValue:    { fontSize: 12, fontWeight: "600", color: "#0F172A", flex: 1 },

  pendingBox:   { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, backgroundColor: "#FFFBEB", padding: 10, borderRadius: 8 },
  pendingText:  { fontSize: 12, color: "#92400E" },

  doneBox:      { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#F0FDF4", padding: 10, borderRadius: 8 },
  doneText:     { fontSize: 12, color: "#166534", flex: 1 },
  reviewBox:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFBEB", padding: 10, borderRadius: 8 },
  reviewText:   { fontSize: 12, color: "#92400E", flex: 1 },

  // Contract form
  contractSummary:      { backgroundColor: "#EFF6FF", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  contractSummaryTitle: { fontSize: 11, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1, marginBottom: 6 },
  contractRef:          { fontSize: 10, color: "#64748B", marginBottom: 8 },
  summaryRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  sumLabel:     { fontSize: 12, color: "#64748B" },
  sumValue:     { fontSize: 12, fontWeight: "700", color: "#0F172A" },

  termsNotice:      { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#F8FAFC", borderRadius: 8, padding: 10, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: "#2563EB" },
  termsNoticeText:  { flex: 1, fontSize: 11, color: "#475569", lineHeight: 16 },

  photoSectionTitle: { fontSize: 11, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1, marginBottom: 8 },
  photoLabel:   { fontSize: 12, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
  photoBox:     { borderWidth: 1.5, borderColor: "#CBD5E1", borderStyle: "dashed", borderRadius: 10, padding: 14, alignItems: "center", gap: 6, marginBottom: 4 },
  photoBoxDone: { borderColor: "#16A34A", backgroundColor: "#F0FDF4", borderStyle: "solid" },
  photoRow:     { flexDirection: "row", alignItems: "center", gap: 12 },
  photoThumb:   { width: 52, height: 52, borderRadius: 8, backgroundColor: "#E2E8F0" },
  photoOk:      { fontSize: 12, fontWeight: "700", color: "#16A34A" },
  photoChange:  { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  photoHint:    { fontSize: 12, color: "#64748B", textAlign: "center" },

  agreeRow:     { flexDirection: "row", alignItems: "flex-start", gap: 10, marginVertical: 12, backgroundColor: "#F8FAFC", padding: 10, borderRadius: 8 },
  checkbox:     { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
  checkboxOn:   { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  agreeText:    { flex: 1, fontSize: 12, color: "#334155", lineHeight: 18 },

  cta:          { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#16A34A", paddingVertical: 13, borderRadius: 12, marginTop: 4 },
  ctaDim:       { backgroundColor: "#94A3B8" },
  ctaText:      { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Payment
  amountBox:    { backgroundColor: "#EFF6FF", borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 14 },
  amountLabel:  { fontSize: 11, color: "#3B82F6", fontWeight: "600", marginBottom: 4 },
  amountValue:  { fontSize: 28, fontWeight: "800", color: "#1D4ED8" },
  amountNote:   { fontSize: 11, color: "#64748B", marginTop: 4 },

  methodTitle:  { fontSize: 12, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  methodGrid:   { gap: 8, marginBottom: 12 },
  methodBtn:    { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 10, padding: 12, backgroundColor: "#fff" },
  methodLabel:  { flex: 1, fontSize: 13, color: "#334155" },

  fieldGroup:   { gap: 4, marginBottom: 12 },
  fieldRow:     { flexDirection: "row", gap: 10, marginTop: 8 },
  fieldLabel:   { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 4 },
  input:        { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: "#fff" },

  cashNotice:   { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FFFBEB", padding: 12, borderRadius: 8, marginBottom: 12 },
  cashNoticeText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 18 },

  // QR
  qrPlaceholder: { alignItems: "center", paddingVertical: 24, gap: 10 },
  qrTitle:      { fontSize: 16, fontWeight: "700", color: "#94A3B8" },
  qrNote:       { fontSize: 12, color: "#CBD5E1", textAlign: "center", lineHeight: 18, maxWidth: 260 },
  txBox:        { backgroundColor: "#F1F5F9", borderRadius: 8, padding: 10, marginTop: 8, alignItems: "center" },
  txLabel:      { fontSize: 10, color: "#94A3B8", fontWeight: "600" },
  txValue:      { fontSize: 12, fontWeight: "700", color: "#0F172A", marginTop: 2 },

  // QR waiting state
  qrWaiting:    { backgroundColor: "#FFFBEB", borderRadius: 10, padding: 14, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#FDE68A" },
  qrWaitTitle:  { fontSize: 14, fontWeight: "700", color: "#92400E" },
  qrWaitNote:   { fontSize: 12, color: "#92400E", textAlign: "center", lineHeight: 18 },

  // QR approved state
  qrApproved:   { gap: 12 },
  qrApprovalBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F0FDF4", padding: 10, borderRadius: 8 },
  qrApprovalText: { fontSize: 12, color: "#166534", fontWeight: "600", flex: 1 },
  qrCard:       { alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#E2E8F0", gap: 8 },
  qrImage:      { width: 200, height: 200 },
  qrCardRef:    { fontSize: 12, fontWeight: "700", color: "#1D4ED8" },
  qrCardProp:   { fontSize: 12, color: "#64748B", textAlign: "center" },
  qrInfoGrid:   { gap: 6 },
  qrInfoRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  qrInfoLabel:  { fontSize: 12, color: "#64748B" },
  qrInfoValue:  { fontSize: 12, fontWeight: "600", color: "#0F172A" },
});

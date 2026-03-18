import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Linking, Modal, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, Image,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";
import { sendNotification } from "../../utils/notifications";
import { showAlert } from "../../utils/alerts";

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
  lease_contract_file?: string;
  tenant_signature?: string;
  created_at: string;
  property_type?: string;
}

type PayMethod = "paymongo";

interface ContractState {
  signatureSvg: string;
  sigCaptured: boolean;
  submitting: boolean;
}

interface PayState {
  method: PayMethod | null;
  checkoutUrl: string;
  submitting: boolean;
  done: boolean;
  txId: string;
  checkoutOpened: boolean;
}

const defaultContract = (): ContractState => ({
  signatureSvg: "", sigCaptured: false, submitting: false,
});
const defaultPay = (): PayState => ({
  method: null, checkoutUrl: "", submitting: false, done: false, txId: "", checkoutOpened: false,
});

// ─── SignaturePad component ────────────────────────────────────────────────
interface SigPoint { x: number; y: number; }
type SigStroke = SigPoint[];

function buildSvg(strokes: SigStroke[], w = 320, h = 120): string {
  let paths = "";
  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    let d = `M ${stroke[0].x.toFixed(1)} ${stroke[0].y.toFixed(1)}`;
    for (let i = 1; i < stroke.length; i++) {
      d += ` L ${stroke[i].x.toFixed(1)} ${stroke[i].y.toFixed(1)}`;
    }
    paths += `<path d="${d}" stroke="#1a1a1a" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><rect width="${w}" height="${h}" fill="white"/>${paths}</svg>`;
}

function SignaturePad({ onSave, scrollRef }: { onSave: (svg: string) => void; scrollRef?: React.RefObject<any> }) {

  // ── WEB: raw <canvas> + imperative drawing ──────────────────────────────
  // We use a real HTML <canvas> element with raw DOM pointer events instead
  // of React Native View-based rendering. Canvas drawing is persistent and
  // imperative — once a stroke is drawn it stays until explicitly cleared,
  // completely bypassing React reconciliation and state-timing issues that
  // caused strokes to vanish on pointer release.
  const canvasRef    = useRef<any>(null);
  const webStrokes   = useRef<SigStroke[]>([]);
  const webCurrent   = useRef<SigPoint[]>([]);
  const webIsDown    = useRef(false);
  const [webHasSig, setWebHasSig] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const canvas = canvasRef.current as HTMLCanvasElement | null;
    if (!canvas) return;

    function pos(e: PointerEvent): SigPoint {
      const r = canvas!.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (canvas!.width  / r.width),
        y: (e.clientY - r.top)  * (canvas!.height / r.height),
      };
    }

    function redraw() {
      const ctx = canvas!.getContext("2d")!;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth   = 3;
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";
      const all = [
        ...webStrokes.current,
        ...(webCurrent.current.length > 1 ? [webCurrent.current] : []),
      ];
      for (const stroke of all) {
        if (stroke.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
        ctx.stroke();
      }
    }

    function onDown(e: PointerEvent) {
      e.preventDefault();
      canvas!.setPointerCapture(e.pointerId);
      webIsDown.current   = true;
      webCurrent.current  = [pos(e)];
      redraw();
    }
    function onMove(e: PointerEvent) {
      if (!webIsDown.current) return;
      webCurrent.current.push(pos(e));
      redraw();
      if (webCurrent.current.length > 1) setWebHasSig(true);
    }
    function onUp() {
      if (!webIsDown.current) return;
      webIsDown.current = false;
      if (webCurrent.current.length > 1) {
        // Commit stroke to the ref — canvas already shows it, no redraw needed
        webStrokes.current = [...webStrokes.current, [...webCurrent.current]];
        setWebHasSig(true);
      }
      webCurrent.current = [];
      // DO NOT redraw here — the canvas already has the pixels; redrawing
      // would clear and re-draw, causing the brief-disappear flash on release.
    }

    canvas.addEventListener("pointerdown",   onDown);
    canvas.addEventListener("pointermove",   onMove);
    canvas.addEventListener("pointerup",     onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.style.touchAction = "none";
    canvas.style.cursor      = "crosshair";
    canvas.style.userSelect  = "none";
    canvas.style.display     = "block";

    return () => {
      canvas.removeEventListener("pointerdown",   onDown);
      canvas.removeEventListener("pointermove",   onMove);
      canvas.removeEventListener("pointerup",     onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []); // mount once — refs stay stable

  // ── NATIVE: React Native built-in Responder API ─────────────────────────
  // Uses RN's lowest-level touch API — works on every device, inside any
  // Modal, no external dependencies.
  // onStartShouldSetResponder: () => true  → this View claims every touch
  //   that begins inside it, so the parent ScrollView cannot scroll.
  // locationX/Y are always relative to this View → always accurate.
  const nativeStrokes = useRef<SigStroke[]>([]);
  const currentStroke = useRef<SigPoint[]>([]);
  const [, setRender] = useState(0);

  const rafRef         = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  // Tracks the real pixel size of the canvas View so we can clamp coordinates.
  // Updated by onLayout (safe: overflow:"hidden" is removed, so onLayout only
  // fires on genuine size changes like rotation — NOT on child View additions).
  const canvasSize     = useRef({ width: 320, height: 120 });

  // Stable handlers stored in a ref — created once on mount, never recreated.
  // All mutable state is accessed through refs so stale-closure is never an issue.
  //
  // KEY DESIGN DECISIONS:
  //  • No onMoveShouldSetResponder — that fires when a touch is ALREADY MOVING
  //    and the canvas is not yet the responder (e.g. the user is scrolling and
  //    their finger passes over the canvas). Returning true would steal the
  //    in-progress scroll and start drawing from wherever the finger currently
  //    is, producing the phantom "upward line / curve" the user reported.
  //    The canvas should only respond to touches that BEGIN inside it.
  //  • onStartShouldSetResponder: () => true — canvas claims every touch that
  //    STARTS within it (deepest-View-wins in the bubble phase), preventing the
  //    parent ScrollView from scrolling while drawing.
  //  • onResponderGrant starts EMPTY — grant-phase coords can be (0,0) on some
  //    Android devices; first reliable point comes from onResponderMove.
  const nativeHandlersRef = useRef<any>(null);
  if (nativeHandlersRef.current === null) {
    nativeHandlersRef.current = {
      onStartShouldSetResponder: () => true,

      onResponderGrant: () => {
        scrollRef?.current?.setNativeProps?.({ scrollEnabled: false });
        currentStroke.current = [];
      },

      onResponderMove: (e: any) => {
        // locationX/Y is relative to the responder View (the canvas) — always
        // correct when children have pointerEvents:"none" and there is no
        // capture-phase interception (no onStartShouldSetResponderCapture).
        // Clamp to canvas bounds so a finger at the edge never produces a point
        // outside the View — eliminates the "burst outside the box" artefact.
        const x = Math.max(0, Math.min(e.nativeEvent.locationX, canvasSize.current.width));
        const y = Math.max(0, Math.min(e.nativeEvent.locationY, canvasSize.current.height));
        currentStroke.current.push({ x, y });
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            setRender((n) => n + 1);
          });
        }
      },

      onResponderRelease: () => {
        scrollRef?.current?.setNativeProps?.({ scrollEnabled: true });
        if (currentStroke.current.length > 1) {
          nativeStrokes.current = [...nativeStrokes.current, [...currentStroke.current]];
        }
        currentStroke.current = [];
        setRender((n) => n + 1);
      },

      onResponderTerminate: () => {
        // Fires when an external event (notification, system gesture) interrupts
        // the stroke. Re-enable scroll and discard the partial stroke — the user
        // can re-draw cleanly rather than seeing a half-finished artefact.
        scrollRef?.current?.setNativeProps?.({ scrollEnabled: true });
        currentStroke.current = [];
        setRender((n) => n + 1);
      },
    };
  }
  const nativeHandlers = nativeHandlersRef.current;

  // ── clear / save ────────────────────────────────────────────────────────
  function clear() {
    if (Platform.OS === "web") {
      webStrokes.current = [];
      webCurrent.current = [];
      webIsDown.current  = false;
      setWebHasSig(false);
      const canvas = canvasRef.current as HTMLCanvasElement | null;
      if (canvas) {
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      nativeStrokes.current = [];
      currentStroke.current = [];
      setRender((n) => n + 1);
    }
    onSave("");
  }

  function save() {
    const all = Platform.OS === "web" ? webStrokes.current : nativeStrokes.current;
    if (all.length === 0) return;
    const { width, height } = canvasSize.current;
    onSave(buildSvg(all, Math.round(width), Math.round(height)));
  }

  const nativeHasSig    = nativeStrokes.current.length > 0 || currentStroke.current.length > 1;
  const hasSig          = Platform.OS === "web" ? webHasSig : nativeHasSig;
  const nativeAllRender = [
    ...nativeStrokes.current,
    currentStroke.current.length > 1 ? currentStroke.current : [],
  ];

  return (
    <View>
      {Platform.OS === "web" ? (
        /* ── web canvas ── */
        <View style={SIG.canvas}>
          {/* @ts-ignore – raw HTML <canvas> element, valid on web */}
          <canvas
            ref={canvasRef}
            width={640}
            height={180}
            style={{ width: "100%", height: 120, borderRadius: 10 } as any}
          />
          {!webHasSig && (
            <Text style={[SIG.placeholder, { pointerEvents: "none" } as any]}>
              Sign here using your mouse
            </Text>
          )}
        </View>
      ) : (
        /* ── native view ── */
        <View
          style={SIG.canvas}
          collapsable={false}
          onLayout={(e) => {
            // Record real pixel dimensions for coordinate clamping.
            // Safe: overflow:"hidden" is NOT set on native, so onLayout only
            // fires on genuine View-size changes (mount, rotation), never when
            // child line-segment Views are added during drawing.
            canvasSize.current = {
              width:  e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            };
          }}
          {...nativeHandlers}
        >
          <Text style={[SIG.placeholder, { pointerEvents: "none" } as any]}>
            {nativeHasSig ? "" : "Sign here using your finger"}
          </Text>
          {nativeAllRender.map((stroke, si) =>
            stroke.map((pt, pi) => {
              if (pi === 0) return null;
              const prev  = stroke[pi - 1];
              const dx    = pt.x - prev.x;
              const dy    = pt.y - prev.y;
              const len   = Math.sqrt(dx * dx + dy * dy);
              if (len < 0.5) return null;
              const angle = Math.atan2(dy, dx);
              const cx = (prev.x + pt.x) / 2;
              const cy = (prev.y + pt.y) / 2;
              return (
                <View
                  key={`${si}-${pi}`}
                  style={{
                    position:        "absolute",
                    width:           len,
                    height:          2.5,
                    backgroundColor: "#1a1a1a",
                    borderRadius:    1.25,
                    left:            cx - len / 2,
                    top:             cy - 1.25,
                    transform:       [{ rotate: `${angle}rad` }],
                    pointerEvents:   "none",
                  } as any}
                />
              );
            })
          )}
        </View>
      )}
      <View style={SIG.row}>
        <TouchableOpacity style={SIG.clearBtn} onPress={clear}>
          <Ionicons name="refresh-outline" size={16} color="#666" />
          <Text style={SIG.clearBtnText}>Clear</Text>
        </TouchableOpacity>
        {hasSig ? (
          <TouchableOpacity style={SIG.saveBtn} onPress={save}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={SIG.saveBtnText}>Confirm Signature</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const SIG = StyleSheet.create({
  canvas: {
    width: "100%", height: 120, backgroundColor: "#F8FAFC", borderRadius: 10,
    borderWidth: 1.5, borderColor: "#CBD5E1", borderStyle: "dashed",
    // overflow:"hidden" is intentionally omitted for native:
    //   On Android it causes layout re-measurement every time a child line-segment
    //   View is added, producing onLayout loops and coordinate jumps mid-stroke.
    //   On web it is still needed so the canvas element respects borderRadius.
    ...Platform.select({ web: { overflow: "hidden" as const, position: "relative" as const } }),
  },
  placeholder: { position: "absolute", top: "40%", left: 0, right: 0, textAlign: "center", color: "#94A3B8", fontSize: 13 },
  row:         { flexDirection: "row", gap: 10, marginTop: 10 },
  clearBtn:    { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#F8FAFC" },
  clearBtnText:{ fontSize: 14, color: "#666" },
  saveBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: "#1D4ED8" },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});

// ─── step resolution ───────────────────────────────────────────────────────
type StepId = 0 | 1 | 2 | 3;

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
  const [contractModalBookingId, setContractModalBookingId] = useState<number | null>(null);
  const modalScrollRef = useRef<any>(null);

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

  async function submitContract(b: Booking, onSuccess?: () => void) {
    const c = getContract(b.id);
    if (!c.signatureSvg) { showAlert("Signature Required", "Please draw your signature before submitting."); return; }

    setContractField(b.id, "submitting", true);
    try {
      const form = new FormData();
      form.append("booking_id", String(b.id));
      form.append("tenant_id",  String(userId));
      form.append("signature_data", c.signatureSvg);
      const res  = await fetch(API_ENDPOINTS.SUBMIT_CONTRACT, { method: "POST", body: form });
      const data = await res.json();
      if (data.status === "success") {
        setBookings((prev) =>
          prev.map((bk) => bk.id === b.id ? { ...bk, contract_status: "submitted" } : bk),
        );
        onSuccess?.();
        showAlert("Submitted!", "Your digital signature has been sent for owner review.");
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
    const deposit = Number(b.property_deposit) || Number(b.property_price);
    setPayField(b.id, "submitting", true);

    // BYPASS MODE - Skip PayMongo entirely for testing
    try {
      console.log('BYPASS: Simulating successful payment for booking:', b.id);

      // Simulate a short delay like a real API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create fake successful response
      const fakePaymentData = {
        status: "success",
        checkout_url: "https://fake-checkout.test/success",
        session_id: `fake_${Date.now()}`,
        transaction_id: `BYPASS_PM_${b.id}_${Date.now()}`,
        message: "Bypass payment completed - QR access pass ready!",
        is_mock: true,
        fake_mode: true
      };

      console.log('BYPASS: Fake payment success:', fakePaymentData);

      // Store fake checkout URL and mark method
      setPayments((prev) => ({
        ...prev,
        [b.id]: {
          ...(prev[b.id] ?? defaultPay()),
          submitting: false,
          method: "bypass_paymongo",
          checkoutUrl: fakePaymentData.checkout_url,
          done: true // Auto-complete bypass payment
        },
      }));

      // Automatically mark as completed for testing
      const txId = fakePaymentData.transaction_id;
      await recordLocalPayment(b, txId);

      // Success message - QR will auto-show due to payment completion
      setTimeout(() => {
        showAlert("🎉 Payment Complete!", "Payment bypassed successfully! Your digital QR access pass is now ready. Scroll down to Step 4 to see your QR code!");
      }, 500);

    } catch (error) {
      console.error('Bypass payment error:', error);
      showAlert("Bypass Error", `Even bypass failed: ${error.message}`);
      setPayField(b.id, "submitting", false);
    }
  }

  async function openPayMongoCheckout(b: Booking) {
    const p   = getPayment(b.id);
    const url = p.checkoutUrl;
    if (!url) return;
    try {
      await Linking.openURL(url);
      setPayField(b.id, "checkoutOpened", true);
    } catch {
      showAlert("Error", "Could not open the payment page. Please try again.");
    }
  }

  async function confirmPayMongoPayment(b: Booking) {
    const txId = getPayment(b.id).txId || `PM-${Date.now()}`;
    await recordLocalPayment(b, txId);
  }

  async function recordLocalPayment(b: Booking, txId: string) {
    const deposit = Number(b.property_deposit) || Number(b.property_price);
    try {
      const res  = await fetch(API_ENDPOINTS.PAYMENT, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ booking_id: b.id, amount: deposit, method: "paymongo", type: "security_deposit", escrow: true, transaction_id: txId }),
      });
      const data = await res.json();
      const finalTxId = data.transaction_id ?? txId;
      setPayments((prev) => ({
        ...prev,
        [b.id]: { ...(prev[b.id] ?? defaultPay()), submitting: false, done: true, txId: finalTxId },
      }));
      setBookings((prev) =>
        prev.map((bk) => bk.id === b.id ? { ...bk, payment_status: "pending_owner_approval" } : bk),
      );
      // Notify tenant
      if (userId) {
        sendNotification(
          userId, "tenant", "payment",
          "Payment Submitted!",
          `Your security deposit of ₱${deposit.toLocaleString()} for "${b.property_name}" has been submitted via PayMongo and is awaiting owner approval. Ref: ${finalTxId}`,
          b.id, "approval",
        );
      }
    } catch {
      showAlert("Record Error", "Payment may have succeeded but could not be recorded. Please contact support.");
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
              <Text style={S.reviewText}>Signature submitted — owner is reviewing your digital signature.</Text>
            </View>
          )}

          {isRejected && (
            <View style={[S.alertBox, { borderColor: "#FCA5A5" }]}>
              <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
              <Text style={[S.alertText, { color: "#DC2626" }]}>Contract was rejected. Please contact the owner.</Text>
            </View>
          )}

          {isActive && cs === "none" && (
            <TouchableOpacity
              style={S.signContractBtn}
              onPress={() => setContractModalBookingId(b.id)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="file-sign" size={18} color="#fff" />
              <Text style={S.signContractBtnText}>View & Sign Lease Contract</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  function renderContractModal(b: Booking) {
    const c = getContract(b.id);
    const today = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    const ref   = `PF-${String(b.id).padStart(6, "0")}`;
    const rent  = Number(b.property_price).toLocaleString();
    const dep   = Number(b.property_deposit || b.property_price).toLocaleString();

    const isTransient = (b.property_type ?? "").toLowerCase() === "transient";

    const clauses: [string, string][] = [
      ["1. RENTAL PAYMENT",
        `Monthly rent of ₱${rent} is due on or before the 1st of each month. A grace period of five (5) days is provided. Payments after the grace period are subject to a ₱200/day late fee.`],
      ["2. SECURITY DEPOSIT",
        `A deposit of ₱${dep} is held in escrow. Returned within 30 days after vacating, less any deductions for damages beyond normal wear and tear.`],
      ["3. USE OF PREMISES",
        `The property shall be used exclusively as a private residential dwelling for a maximum of ${b.occupants} occupant(s). Commercial activities and subletting are strictly prohibited without written consent from the LESSOR. Any unauthorized use may result in immediate termination of this agreement.`],
      ["4. MAINTENANCE & REPAIRS",
        "The LESSEE shall keep the property clean and in good condition throughout the duration of the tenancy. Damage caused by the LESSEE's negligence shall be repaired at the LESSEE's expense. Normal wear and tear is accepted and shall not be charged against the security deposit."],
      ["5. ALTERATIONS",
        "The LESSEE shall not make any structural alterations or modifications to the property without prior written consent from the LESSOR. Any approved alterations shall become part of the property and shall not be removed upon vacating unless otherwise agreed in writing."],
      ["6. TERMINATION",
        "Either party may terminate this agreement with a minimum of 30 days written notice prior to the intended date of termination. Early termination by the LESSEE without proper notice may result in forfeiture of the security deposit. The LESSOR reserves the right to terminate this agreement immediately in cases of material breach by the LESSEE."],
      ["7. COMPLIANCE",
        "The LESSEE shall comply with all applicable laws, local ordinances, and property rules throughout the lease period. Illegal activities on the premises are grounds for immediate termination of this agreement. The LESSEE shall also respect the rights and comfort of neighboring tenants and residents."],
    ];

    return (
      <Modal
        visible={contractModalBookingId === b.id}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setContractModalBookingId(null)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={CM.root}>

          {/* ── Top bar ── */}
          <View style={CM.topBar}>
            <View style={{ flex: 1 }}>
              <Text style={CM.topBarTitle}>Lease Agreement</Text>
              <Text style={CM.topBarSub}>{ref} • {today}</Text>
            </View>
            <TouchableOpacity onPress={() => setContractModalBookingId(null)} style={CM.closeBtn}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView ref={modalScrollRef} style={CM.scroll} contentContainerStyle={CM.scrollContent} showsVerticalScrollIndicator={false}>

            {/* ── Contract document ── */}
            <View style={CM.contractDoc}>

              {/* Header */}
              <View style={CM.contractHeader}>
                <Text style={CM.contractHeaderTitle}>LEASE AGREEMENT</Text>
                <Text style={CM.contractHeaderRef}>{ref}</Text>
                <Text style={CM.contractHeaderDate}>{today}</Text>
              </View>

              {/* Preamble */}
              <Text style={CM.contractPreamble}>
                This Lease Agreement (the <Text style={CM.contractBold}>"Agreement"</Text>) is entered into on{" "}
                <Text style={CM.contractBold}>{today}</Text> between the property owner{" "}
                (<Text style={CM.contractBold}>"LESSOR"</Text>) and the undersigned tenant{" "}
                (<Text style={CM.contractBold}>"LESSEE"</Text>), under the terms and conditions set forth herein.
              </Text>

              {/* Section: Parties */}
              <View style={CM.contractSection}>
                <Text style={CM.contractSectionTitle}>PARTIES TO THE AGREEMENT</Text>
                <View style={CM.contractFieldRow}>
                  <Text style={CM.contractFieldLabel}>LESSEE (Tenant)</Text>
                  <Text style={CM.contractFieldValue}>{tenantName}</Text>
                </View>
                <View style={CM.contractFieldRow}>
                  <Text style={CM.contractFieldLabel}>Property Name</Text>
                  <Text style={CM.contractFieldValue}>{b.property_name}</Text>
                </View>
              </View>

              {/* Section: Property */}
              <View style={CM.contractSection}>
                <Text style={CM.contractSectionTitle}>SUBJECT PROPERTY</Text>
                <View style={CM.contractFieldRow}>
                  <Text style={CM.contractFieldLabel}>Property Name</Text>
                  <Text style={CM.contractFieldValue}>{b.property_name}</Text>
                </View>
                <View style={CM.contractFieldRow}>
                  <Text style={CM.contractFieldLabel}>Address</Text>
                  <Text style={CM.contractFieldValue}>{b.property_address}</Text>
                </View>
              </View>

              {/* Section: Terms */}
              <View style={CM.contractSection}>
                <Text style={CM.contractSectionTitle}>LEASE TERMS</Text>
                {([
                  ["Move-in Date",    b.move_in],
                  ["Lease Duration",  b.lease_duration],
                  ["Monthly Rent",    `₱${rent}`],
                  ["Security Deposit",`₱${dep}`],
                  ["No. of Occupants",`${b.occupants} person(s)`],
                ] as [string, string][]).map(([label, value]) => (
                  <View key={label} style={CM.contractFieldRow}>
                    <Text style={CM.contractFieldLabel}>{label}</Text>
                    <Text style={[CM.contractFieldValue, CM.contractBold]}>{value}</Text>
                  </View>
                ))}
              </View>

              {/* Section: T&C — hidden for Transient properties */}
              {!isTransient && (
              <View style={CM.contractSection}>
                <Text style={CM.contractSectionTitle}>TERMS AND CONDITIONS</Text>
                {clauses.map(([title, body]) => (
                  <View key={title} style={CM.contractClause}>
                    <Text style={CM.clauseTitle}>{title}</Text>
                    <Text style={CM.clauseBody}>{body}</Text>
                  </View>
                ))}
              </View>
              )}

              {/* Acknowledgement */}
              <Text style={[CM.contractPreamble, { marginTop: 10, borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 12 }]}>
                {isTransient
                  ? "By affixing their digital signature below, the LESSEE confirms their intent to occupy the property during the agreed period and agrees to the house rules and check-in/check-out conditions of the LESSOR."
                  : "By affixing their digital signature below, the LESSEE confirms they have read, understood, and voluntarily agreed to all terms and conditions of this Lease Agreement."}
              </Text>
            </View>

            <View style={CM.divider} />

            {/* ── Digital Signature ── */}
            <View style={CM.sectionHeaderRow}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color="#1D4ED8" />
              <Text style={CM.sectionHeaderText}>LESSEE'S DIGITAL SIGNATURE</Text>
            </View>
            <Text style={CM.introText}>
              Draw your signature below using your finger. This legally confirms your agreement to all terms in the contract above.
            </Text>

            {c.sigCaptured ? (
              <View style={CM.sigConfirmedBox}>
                <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                <Text style={CM.sigConfirmedText}>Signature captured! You may now submit.</Text>
                <TouchableOpacity onPress={() => {
                  setContractField(b.id, "sigCaptured", false);
                  setContractField(b.id, "signatureSvg", "");
                }}>
                  <Text style={{ fontSize: 12, color: "#007AFF", marginTop: 4 }}>Re-draw signature</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <SignaturePad scrollRef={modalScrollRef} onSave={(svg) => {
                if (svg) {
                  setContractField(b.id, "signatureSvg", svg);
                  setContractField(b.id, "sigCaptured", true);
                } else {
                  setContractField(b.id, "signatureSvg", "");
                  setContractField(b.id, "sigCaptured", false);
                }
              }} />
            )}

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[CM.submitBtn, (!c.sigCaptured || c.submitting) && CM.submitBtnDim]}
              onPress={() => submitContract(b, () => setContractModalBookingId(null))}
              disabled={c.submitting || !c.sigCaptured}
              activeOpacity={0.85}
            >
              {c.submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={18} color="#fff" />
                  <Text style={CM.submitBtnText}>Submit Signed Contract</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={CM.disclaimer}>
              Your digital signature is legally binding and confirms your agreement to the lease terms above. The signed contract will be sent to the property owner for final review and approval.
            </Text>

          </ScrollView>
        </View>
        </GestureHandlerRootView>
      </Modal>
    );
  }


  function renderPaymentStep(b: Booking, step: StepId) {
    const isActive = step === 2;
    const locked   = step < 2;
    const p        = getPayment(b.id);
    const isDone   = p.done || ["paid","pending_owner_approval","approved"].includes(b.payment_status ?? "none");
    const deposit  = Number(b.property_deposit) || Number(b.property_price);

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
                  : "Payment submitted via PayMongo. Waiting for owner approval..."}
              </Text>
            </View>
          )}

          {isActive && !isDone && (
            <>
              {/* Amount */}
              <View style={S.amountBox}>
                <Text style={S.amountLabel}>Security Deposit Due</Text>
                <Text style={S.amountValue}>₱{deposit.toLocaleString()}</Text>
                <Text style={S.amountNote}>Held in PadFinder Escrow • Refundable</Text>
              </View>

              {/* PayMongo Banner */}
              <View style={S.paymongoCard}>
                <View style={S.paymongoHeader}>
                  <Ionicons name="shield-checkmark" size={22} color="#1D4ED8" />
                  <Text style={S.paymongoTitle}>Pay via PayMongo</Text>
                </View>
                <Text style={S.paymongoDesc}>
                  Secure online payment powered by PayMongo. Pay using GCash, Credit/Debit Card, or Online Banking — all in one checkout page.
                </Text>
                <View style={S.paymongoMethods}>
                  {[
                    { icon: "phone-portrait-outline", label: "GCash"        },
                    { icon: "card-outline",           label: "Card"         },
                    { icon: "business-outline",       label: "Online Bank"  },
                  ].map((m) => (
                    <View key={m.label} style={S.paymongoMethod}>
                      <Ionicons name={m.icon as any} size={16} color="#1D4ED8" />
                      <Text style={S.paymongoMethodTxt}>{m.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Step 1: Create Payment Link */}
              {!p.checkoutUrl && (
                <TouchableOpacity
                  style={[S.cta, { backgroundColor: "#1D4ED8" }]}
                  onPress={() => submitPayment(b)}
                  disabled={p.submitting}
                >
                  {p.submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                      <Text style={S.ctaText}>Pay ₱{deposit.toLocaleString()} via PayMongo</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Step 2: Open Checkout URL */}
              {!!p.checkoutUrl && !p.checkoutOpened && (
                <View style={{ gap: 10, marginTop: 4 }}>
                  <View style={S.checkoutReadyBox}>
                    <Ionicons name="checkmark-circle" size={18} color="#059669" />
                    <Text style={S.checkoutReadyTxt}>Payment link ready! Tap below to open PayMongo checkout.</Text>
                  </View>
                  <TouchableOpacity style={[S.cta, { backgroundColor: "#059669" }]} onPress={() => openPayMongoCheckout(b)}>
                    <Ionicons name="open-outline" size={16} color="#fff" />
                    <Text style={S.ctaText}>Open PayMongo Checkout</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 3: After checkout opened, confirm payment */}
              {!!p.checkoutUrl && p.checkoutOpened && (
                <View style={{ gap: 10, marginTop: 4 }}>
                  <View style={S.checkoutOpenedBox}>
                    <Ionicons name="information-circle-outline" size={18} color="#D97706" />
                    <Text style={S.checkoutOpenedTxt}>
                      Complete the payment on the PayMongo page, then tap "I Have Paid" below.
                    </Text>
                  </View>
                  <TouchableOpacity style={[S.cta, { backgroundColor: "#059669" }]} onPress={() => confirmPayMongoPayment(b)}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                    <Text style={S.ctaText}>I Have Paid — Confirm Payment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.cta, { backgroundColor: "#6366F1" }]}
                    onPress={() => openPayMongoCheckout(b)}
                  >
                    <Ionicons name="open-outline" size={16} color="#fff" />
                    <Text style={S.ctaText}>Re-open Checkout Page</Text>
                  </TouchableOpacity>
                </View>
              )}
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

    // AUTO QR GENERATION: Include bypass/fake payments
    const hasPayment = isPending || isApproved;
    const autoQREnabled = hasPayment; // Generate QR automatically for any payment

    const deposit = Number(b.property_deposit) || Number(b.property_price);

    const qrData = [
      "PADFINDER TENANT QR ACCESS PASS",
      `Reference: PF-${String(b.id).padStart(6, "0")}`,
      `Tenant: ${tenantName}`,
      `Property: ${b.property_name}`,
      `Address: ${b.property_address}`,
      `Security Deposit: ₱${deposit.toLocaleString()}`,
      `Monthly Rent: ₱${Number(b.property_price).toLocaleString()}`,
      `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      `Status: ${autoQREnabled ? 'VERIFIED ACCESS' : 'PENDING'}`,
      `Valid Until: ${new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString("en-US")}`, // 1 year validity
      "Scan at Property for Instant Access"
    ].join("\n");

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=15&format=png&ecc=M&qzone=2&data=${encodeURIComponent(qrData)}`;

    return (
      <View style={[S.stepRow, { marginBottom: 0 }]}>
        <View style={S.stepLeft}>
          <StepDot active={isActive && !autoQREnabled} done={autoQREnabled} />
        </View>
        <View style={[S.stepContent, (isActive || autoQREnabled) && S.stepActive, locked && S.stepLocked, autoQREnabled && S.stepDone, { marginBottom: 0 }]}>
          <View style={S.stepTitleRow}>
            <Text style={S.stepLabel}>Step 4</Text>
            {locked && <View style={[S.badge, S.badgeLocked]}><Text style={S.badgeText}>LOCKED</Text></View>}
            {isActive && hasPayment && !autoQREnabled && <View style={[S.badge, S.badgeReview]}><Text style={S.badgeText}>GENERATING</Text></View>}
            {autoQREnabled && <View style={[S.badge, S.badgeQRReady]}><Text style={S.badgeText}>QR READY</Text></View>}
          </View>
          <Text style={[S.stepTitle, locked && S.stepTitleLocked]}>Digital Access Pass</Text>

          {locked && <Text style={S.lockedNote}>Complete payment to unlock your digital QR access pass.</Text>}

          {autoQREnabled && (
            <View style={S.qrReadySection}>
              {/* QR Success Banner */}
              <View style={S.qrSuccessBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                <Text style={S.qrSuccessTitle}>🎉 Access Pass Generated!</Text>
              </View>

              <Text style={S.qrDescription}>
                Your digital access pass is ready! Show this QR code at the property for instant verification and access to building amenities.
              </Text>

              {/* QR Code Display */}
              <View style={S.qrCodeContainer}>
                <View style={S.qrCodeFrame}>
                  <Image source={{ uri: qrUrl }} style={S.qrCodeImage} />
                  {/* Verification badge - positioned at bottom right of QR */}
                  <View style={[S.qrCodeOverlay, { bottom: 8, right: 8, top: undefined }]}>
                    <MaterialCommunityIcons name="shield-check" size={24} color="#059669" />
                  </View>
                </View>

                <View style={S.qrInfoBox}>
                  <Text style={S.qrRefText}>Ref: PF-{String(b.id).padStart(6, "0")}</Text>
                  <Text style={S.qrValidText}>✅ Valid for Property Access</Text>
                  <Text style={S.qrExpiryText}>Expires: {new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString()}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={S.qrActions}>
                <TouchableOpacity
                  style={S.qrDownloadBtn}
                  onPress={() => router.push({
                    pathname: "/tenant/payment-qr",
                    params: {
                      booking_id: b.id,
                      transaction_id: `QR_${b.id}_${Date.now()}`,
                      property_name: b.property_name,
                      property_address: b.property_address,
                      amount: deposit,
                      monthly_rent: b.property_price,
                      payment_method: "bypass_paymongo"
                    }
                  } as any)}
                >
                  <MaterialCommunityIcons name="download" size={16} color="#2563EB" />
                  <Text style={S.qrDownloadText}>Download Full Pass</Text>
                </TouchableOpacity>

                <TouchableOpacity style={S.qrShareBtn}>
                  <MaterialCommunityIcons name="share-variant" size={16} color="#fff" />
                  <Text style={S.qrShareText}>Share QR Code</Text>
                </TouchableOpacity>
              </View>

              {/* Usage Instructions */}
              <View style={S.qrInstructions}>
                <Text style={S.qrInstructionsTitle}>📱 How to Use Your Access Pass:</Text>
                <View style={S.instructionsList}>
                  <Text style={S.instructionItem}>• Present QR code at property entrance</Text>
                  <Text style={S.instructionItem}>• Security/landlord scans for verification</Text>
                  <Text style={S.instructionItem}>• Instant access to building amenities</Text>
                  <Text style={S.instructionItem}>• Keep saved on your phone for quick access</Text>
                </View>
              </View>
            </View>
          )}

          {/* Legacy states for non-bypass payments */}
          {!autoQREnabled && isActive && isPending && (
            <View style={S.qrWaiting}>
              <ActivityIndicator size="small" color="#D97706" />
              <Text style={S.qrWaitTitle}>Generating Access Pass...</Text>
              <Text style={S.qrWaitNote}>
                Processing your payment verification. Your QR access pass will be ready momentarily.
              </Text>
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

      {/* Contract Modal — a single modal rendered at the top level so only one is open at a time */}
      {contractModalBookingId !== null && (() => {
        const modalBooking = bookings.find((bk) => bk.id === contractModalBookingId);
        return modalBooking ? renderContractModal(modalBooking) : null;
      })()}
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

  bookingCard:  { backgroundColor: "#fff", borderRadius: 16, marginBottom: 18, overflow: "hidden", ...Platform.select({ web: { boxShadow: "0 2px 10px rgba(0,0,0,0.07)" } as any, default: { shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 } }) },
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
  stepActive:   { backgroundColor: "#fff", borderColor: "#BFDBFE", ...Platform.select({ web: { boxShadow: "0 2px 8px rgba(37,99,235,0.08)" } as any, default: { shadowColor: "#2563EB", shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 } }) },
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

  // PayMongo styles
  paymongoCard:       { backgroundColor: "#EFF6FF", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  paymongoHeader:     { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  paymongoTitle:      { fontSize: 16, fontWeight: "700", color: "#1D4ED8" },
  paymongoDesc:       { fontSize: 13, color: "#374151", lineHeight: 18, marginBottom: 10 },
  paymongoMethods:    { flexDirection: "row", gap: 12 },
  paymongoMethod:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#BFDBFE" },
  paymongoMethodTxt:  { fontSize: 12, fontWeight: "600", color: "#1D4ED8" },
  checkoutReadyBox:   { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#F0FDF4", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#BBF7D0" },
  checkoutReadyTxt:   { flex: 1, fontSize: 13, color: "#065F46", lineHeight: 18 },
  checkoutOpenedBox:  { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FFFBEB", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#FDE68A" },
  checkoutOpenedTxt:  { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 18 },

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

  // Enhanced QR Ready State
  badgeQRReady:         { backgroundColor: "#059669" },
  qrReadySection:       { gap: 14 },
  qrSuccessBanner:      { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F0FDF4", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#BBF7D0" },
  qrSuccessTitle:       { fontSize: 14, fontWeight: "700", color: "#166534", flex: 1 },
  qrDescription:        { fontSize: 13, color: "#64748B", lineHeight: 20, textAlign: "center" },

  qrCodeContainer:      { alignItems: "center", gap: 12 },
  qrCodeFrame:          { backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 2, borderColor: "#E2E8F0", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  qrCodeImage:          { width: 200, height: 200, borderRadius: 8 },
  qrCodeOverlay:        { position: "absolute" as const, top: 8, right: 8, backgroundColor: "#fff", borderRadius: 12, padding: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },

  qrInfoBox:            { alignItems: "center", gap: 2 },
  qrRefText:            { fontSize: 14, fontWeight: "800", color: "#1D4ED8" },
  qrValidText:          { fontSize: 12, fontWeight: "600", color: "#059669" },
  qrExpiryText:         { fontSize: 11, color: "#94A3B8" },

  qrActions:            { flexDirection: "row", gap: 10 },
  qrDownloadBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EFF6FF", paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#BFDBFE" },
  qrDownloadText:       { fontSize: 13, fontWeight: "600", color: "#2563EB" },
  qrShareBtn:           { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#059669", paddingVertical: 12, borderRadius: 10 },
  qrShareText:          { fontSize: 13, fontWeight: "600", color: "#fff" },

  qrInstructions:       { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#E2E8F0" },
  qrInstructionsTitle:  { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 8 },
  instructionsList:     { gap: 4 },
  instructionItem:      { fontSize: 12, color: "#64748B", lineHeight: 18 },

  // Sign Contract button (replaces inline form)
  signContractBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1D4ED8", paddingVertical: 14, borderRadius: 12, marginTop: 6 },
  signContractBtnText: { color: "#fff", fontSize: 14, fontWeight: "700", flex: 1, textAlign: "center" },
});

const CM = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#F8F9FA" },
  topBar:           { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 12 },
  topBarTitle:      { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  topBarSub:        { fontSize: 11, color: "#64748B", marginTop: 1 },
  closeBtn:         { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  scroll:           { flex: 1 },
  scrollContent:    { padding: 16, paddingBottom: 60 },

  // ── Contract document container ──────────────────────────────────────────
  contractDoc: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 4,
    overflow: "hidden",
    ...Platform.select({ web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" } as any }),
  },

  // Document header (blue banner)
  contractHeader:     { backgroundColor: "#1D4ED8", paddingVertical: 20, paddingHorizontal: 20, alignItems: "center", gap: 4 },
  contractHeaderTitle:{ fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 1.5 },
  contractHeaderRef:  { fontSize: 11, color: "#BFDBFE", fontWeight: "600", marginTop: 2 },
  contractHeaderDate: { fontSize: 11, color: "#BFDBFE" },

  // Document body text
  contractPreamble:   { fontSize: 12, color: "#374151", lineHeight: 19, padding: 16, paddingBottom: 4 },
  contractBold:       { fontWeight: "700", color: "#0F172A" },

  // Sections inside the document
  contractSection:    { borderTopWidth: 1, borderTopColor: "#F1F5F9", marginHorizontal: 16, paddingVertical: 12 },
  contractSectionTitle:{ fontSize: 10, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1.2, marginBottom: 10, textTransform: "uppercase" },

  // Field label/value rows
  contractFieldRow:   { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  contractFieldLabel: { width: 130, fontSize: 11, color: "#64748B", fontWeight: "600" },
  contractFieldValue: { flex: 1, fontSize: 12, color: "#0F172A" },

  // T&C clauses
  contractClause:     { marginBottom: 10 },
  clauseTitle:        { fontSize: 11, fontWeight: "700", color: "#0F172A", marginBottom: 3 },
  clauseBody:         { fontSize: 11, color: "#475569", lineHeight: 17 },

  divider:            { height: 1, backgroundColor: "#E2E8F0", marginVertical: 18 },

  // Section header pill (blue)
  sectionHeaderRow:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EFF6FF", borderRadius: 8, padding: 10, marginBottom: 10, marginTop: 4 },
  sectionHeaderText:  { fontSize: 11, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1 },
  introText:          { fontSize: 12, color: "#64748B", marginBottom: 14, lineHeight: 18 },

  // Signature confirmation
  sigConfirmedBox:    { alignItems: "center", backgroundColor: "#F0FDF4", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#86EFAC", gap: 6 },
  sigConfirmedText:   { fontSize: 14, fontWeight: "700", color: "#16A34A" },

  // Submit
  submitBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#16A34A", paddingVertical: 16, borderRadius: 14, marginTop: 16 },
  submitBtnDim:  { backgroundColor: "#94A3B8" },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  disclaimer:    { textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 14, lineHeight: 17, paddingHorizontal: 10 },
});

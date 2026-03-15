import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from "react-native";
import API_ENDPOINTS from "../../config/api";

type PaymentMethod = "gcash" | "card" | "bank_transfer" | "cash";
type FlowStep = "overview" | "deposit_amount" | "method" | "details" | "review" | "processing" | "success";

export default function EscrowPaymentPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    booking_id: string;
    amount: string;
    property_name: string;
    property_address: string;
    monthly_rent: string;
  }>();

  const bookingId = params.booking_id;
  const monthlyRent = Number(params.monthly_rent ?? 0);
  const propertyName = params.property_name ?? "Property";
  const propertyAddress = params.property_address ?? "";

  // The security deposit is set by the owner (passed via params or defaults to 1 month rent)
  const ownerDepositAmount = Number(params.amount ?? monthlyRent);

  const [step, setStep] = useState<FlowStep>("overview");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState("");

  // Payment detail fields
  const [gcashNumber, setGcashNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  function validateDetails(): boolean {
    if (!selectedMethod) { Alert.alert("Select Method", "Please choose a payment method."); return false; }
    if (selectedMethod === "gcash" && !gcashNumber.trim()) {
      Alert.alert("Missing Info", "Please enter your GCash number."); return false;
    }
    if (selectedMethod === "card") {
      if (!cardName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCVV.trim()) {
        Alert.alert("Missing Info", "Please fill in all card details."); return false;
      }
    }
    if (selectedMethod === "bank_transfer") {
      if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
        Alert.alert("Missing Info", "Please fill in all bank transfer details."); return false;
      }
    }
    return true;
  }

  async function submitDeposit() {
    setStep("processing");
    try {
      const res = await fetch(API_ENDPOINTS.PAYMENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: Number(bookingId),
          amount: ownerDepositAmount,
          method: selectedMethod,
          type: "security_deposit",
          escrow: true,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setTransactionId(data.transaction_id ?? `ESC-${Date.now()}`);
        setStep("success");
      } else {
        Alert.alert("Payment Failed", data.message ?? "Please try again.");
        setStep("review");
      }
    } catch {
      Alert.alert("Connection Error", "Could not reach the server.");
      setStep("review");
    }
  }

  const methodLabel = (m: PaymentMethod) =>
    ({ gcash: "GCash", card: "Credit / Debit Card", bank_transfer: "Bank Transfer", cash: "Cash" }[m]);

  // ─── OVERVIEW ─────────────────────────────────────────────────────────────
  if (step === "overview") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Security Deposit</Text>
            <Text style={styles.headerSub}>Escrow Protected</Text>
          </View>
          <View style={styles.escrowBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#059669" />
            <Text style={styles.escrowBadgeText}>Escrow</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero */}
          <View style={styles.heroBanner}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="shield-lock" size={40} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Your Deposit is Safe with Us</Text>
            <Text style={styles.heroSub}>
              PadFinder holds your security deposit in escrow. You get it back when you move out — as long as the unit is in good condition.
            </Text>
          </View>

          {/* Property */}
          <View style={styles.propertyCard}>
            <View style={styles.propertyIconBox}>
              <Ionicons name="home" size={22} color="#1D4ED8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.propertyName}>{propertyName}</Text>
              {!!propertyAddress && <Text style={styles.propertyAddress}>{propertyAddress}</Text>}
            </View>
          </View>

          {/* Deposit Amount Set by Owner */}
          <View style={styles.depositAmountCard}>
            <View style={styles.depositAmountTop}>
              <Text style={styles.depositAmountLabel}>Security Deposit Required</Text>
              <Text style={styles.depositAmountNote}>Set by the property owner</Text>
            </View>
            <Text style={styles.depositAmountValue}>₱{ownerDepositAmount.toLocaleString()}</Text>
            <View style={styles.depositAmountBottom}>
              <Ionicons name="information-circle-outline" size={14} color="#2563EB" />
              <Text style={styles.depositAmountHint}>
                This amount is held in escrow and returned to you after a clean move-out.
              </Text>
            </View>
          </View>

          {/* How It Works */}
          <View style={styles.howCard}>
            <Text style={styles.howTitle}>How the Escrow Deposit Works</Text>

            {[
              {
                icon: "cash-outline",
                color: "#2563EB", bg: "#EFF6FF",
                title: "You Pay the Deposit",
                desc: "You deposit ₱" + ownerDepositAmount.toLocaleString() + " into PadFinder's secure escrow account. This money is NOT given to the owner yet.",
              },
              {
                icon: "home-outline",
                color: "#7C3AED", bg: "#F5F3FF",
                title: "You Live in the Property",
                desc: "Enjoy your stay. The deposit remains safely held in escrow throughout your lease.",
              },
              {
                icon: "clipboard-check-outline",
                color: "#0891B2", bg: "#ECFEFF",
                title: "Move-Out Inspection",
                desc: "When your lease ends, the owner inspects the unit for any damage or missing items.",
              },
              {
                icon: "checkmark-circle-outline",
                color: "#059669", bg: "#F0FDF4",
                title: "No Damage → Full Refund",
                desc: "If the unit is in good condition, the owner releases 100% of your deposit back to you.",
              },
              {
                icon: "alert-circle-outline",
                color: "#D97706", bg: "#FFFBEB",
                title: "With Damage → Partial/No Refund",
                desc: "If there's damage or missing items, the owner deducts repair costs. The remainder (if any) is returned to you.",
              },
            ].map((item, i) => (
              <View key={i} style={styles.howStep}>
                <View style={[styles.howStepIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.howStepTitle}>{item.title}</Text>
                  <Text style={styles.howStepDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Tenant Rights */}
          <View style={styles.rightsCard}>
            <View style={styles.rightsHeader}>
              <Ionicons name="shield-checkmark" size={18} color="#059669" />
              <Text style={styles.rightsTitle}>Your Tenant Rights</Text>
            </View>
            {[
              "The owner cannot use your deposit before you move out",
              "You will receive an itemized list of any deductions",
              "You can dispute unfair deductions through PadFinder",
              "Deposit must be returned within 30 days of move-out",
              "PadFinder mediates any deposit disputes between parties",
            ].map((right, i) => (
              <View key={i} style={styles.rightsRow}>
                <Ionicons name="checkmark-circle" size={15} color="#059669" />
                <Text style={styles.rightsText}>{right}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep("method")}>
            <Ionicons name="shield-checkmark" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>
              Pay Deposit — ₱{ownerDepositAmount.toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()}>
            <Text style={styles.ghostBtnText}>I'll do this later</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── METHOD ───────────────────────────────────────────────────────────────
  if (step === "method") {
    const methods: { key: PaymentMethod; icon: string; label: string; desc: string }[] = [
      { key: "gcash", icon: "phone-portrait-outline", label: "GCash", desc: "Mobile wallet — instant transfer" },
      { key: "card", icon: "card-outline", label: "Credit / Debit Card", desc: "Visa, Mastercard, JCB" },
      { key: "bank_transfer", icon: "business-outline", label: "Bank Transfer", desc: "BDO, BPI, Metrobank & more" },
      { key: "cash", icon: "cash-outline", label: "Cash", desc: "Pay at a PadFinder partner office" },
    ];

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep("overview")} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Payment Method</Text>
            <Text style={styles.headerSub}>Step 1 of 3</Text>
          </View>
          <View style={styles.amountChip}>
            <Text style={styles.amountChipText}>₱{ownerDepositAmount.toLocaleString()}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionLabel}>How do you want to pay the deposit?</Text>

          {methods.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodCard, selectedMethod === m.key && styles.methodCardActive]}
              onPress={() => setSelectedMethod(m.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.methodIconBox, selectedMethod === m.key && styles.methodIconBoxActive]}>
                <Ionicons
                  name={m.icon as any}
                  size={22}
                  color={selectedMethod === m.key ? "#fff" : "#64748B"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodLabel, selectedMethod === m.key && styles.methodLabelActive]}>
                  {m.label}
                </Text>
                <Text style={styles.methodDesc}>{m.desc}</Text>
              </View>
              {selectedMethod === m.key
                ? <Ionicons name="checkmark-circle" size={22} color="#1D4ED8" />
                : <View style={styles.methodRadio} />
              }
            </TouchableOpacity>
          ))}

          <View style={styles.secureRow}>
            <Ionicons name="lock-closed-outline" size={14} color="#64748B" />
            <Text style={styles.secureText}>
              Payment goes directly to escrow — not the owner
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !selectedMethod && styles.primaryBtnDisabled]}
            onPress={() => { if (!selectedMethod) { Alert.alert("Select a method"); return; } setStep("details"); }}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── DETAILS ──────────────────────────────────────────────────────────────
  if (step === "details") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep("method")} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Payment Details</Text>
            <Text style={styles.headerSub}>Step 2 of 3</Text>
          </View>
          <View style={styles.amountChip}>
            <Text style={styles.amountChipText}>₱{ownerDepositAmount.toLocaleString()}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {selectedMethod === "cash" && (
            <View style={styles.cashCard}>
              <Ionicons name="cash" size={28} color="#059669" />
              <Text style={styles.cashTitle}>Cash Deposit Instructions</Text>
              <Text style={styles.cashText}>
                Bring the exact amount to any PadFinder partner office. Show your booking reference and our staff will receive the deposit and place it in escrow.
              </Text>
              <View style={styles.cashDetail}>
                <Text style={styles.cashDetailLabel}>Booking Reference</Text>
                <Text style={styles.cashDetailValue}>BOOK-{bookingId}</Text>
              </View>
              <View style={styles.cashDetail}>
                <Text style={styles.cashDetailLabel}>Amount to Bring</Text>
                <Text style={styles.cashDetailValue}>₱{ownerDepositAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.cashDetail}>
                <Text style={styles.cashDetailLabel}>Office Hours</Text>
                <Text style={styles.cashDetailValue}>Mon–Sat, 8AM–5PM</Text>
              </View>
            </View>
          )}

          {selectedMethod === "gcash" && (
            <View style={styles.formCard}>
              <View style={styles.formCardHeader}>
                <Ionicons name="phone-portrait-outline" size={20} color="#1D4ED8" />
                <Text style={styles.formCardTitle}>GCash Number</Text>
              </View>
              <Text style={styles.formLabel}>Your GCash Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="09XX XXX XXXX"
                value={gcashNumber}
                onChangeText={setGcashNumber}
                keyboardType="phone-pad"
                maxLength={11}
                placeholderTextColor="#CBD5E1"
              />
              <View style={styles.formHint}>
                <Ionicons name="information-circle-outline" size={13} color="#2563EB" />
                <Text style={styles.formHintText}>
                  A GCash payment request of ₱{ownerDepositAmount.toLocaleString()} will be sent to this number. Approve it to fund your escrow deposit.
                </Text>
              </View>
            </View>
          )}

          {selectedMethod === "card" && (
            <View style={styles.formCard}>
              <View style={styles.formCardHeader}>
                <Ionicons name="card-outline" size={20} color="#1D4ED8" />
                <Text style={styles.formCardTitle}>Card Details</Text>
              </View>
              <Text style={styles.formLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="JUAN DELA CRUZ"
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="characters"
                placeholderTextColor="#CBD5E1"
              />
              <Text style={styles.formLabel}>Card Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="number-pad"
                maxLength={19}
                placeholderTextColor="#CBD5E1"
              />
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Expiry (MM/YY)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholderTextColor="#CBD5E1"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>CVV</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="123"
                    value={cardCVV}
                    onChangeText={setCardCVV}
                    keyboardType="number-pad"
                    maxLength={3}
                    secureTextEntry
                    placeholderTextColor="#CBD5E1"
                  />
                </View>
              </View>
              <Text style={styles.cardAccepted}>Accepted: Visa · Mastercard · JCB</Text>
            </View>
          )}

          {selectedMethod === "bank_transfer" && (
            <View style={styles.formCard}>
              <View style={styles.formCardHeader}>
                <Ionicons name="business-outline" size={20} color="#1D4ED8" />
                <Text style={styles.formCardTitle}>Bank Transfer Details</Text>
              </View>
              <Text style={styles.formLabel}>Your Bank</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., BDO, BPI, Metrobank"
                value={bankName}
                onChangeText={setBankName}
                placeholderTextColor="#CBD5E1"
              />
              <Text style={styles.formLabel}>Account Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="1234567890"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="number-pad"
                placeholderTextColor="#CBD5E1"
              />
              <Text style={styles.formLabel}>Account Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Your full name"
                value={accountName}
                onChangeText={setAccountName}
                placeholderTextColor="#CBD5E1"
              />
              <View style={styles.formHint}>
                <Ionicons name="information-circle-outline" size={13} color="#2563EB" />
                <Text style={styles.formHintText}>
                  Transfer ₱{ownerDepositAmount.toLocaleString()} to PadFinder's escrow account. Use your booking reference BOOK-{bookingId} as the transfer note.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => { if (validateDetails()) setStep("review"); }}
          >
            <Text style={styles.primaryBtnText}>Review Deposit</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── REVIEW ───────────────────────────────────────────────────────────────
  if (step === "review") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep("details")} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Review & Confirm</Text>
            <Text style={styles.headerSub}>Step 3 of 3</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Review Summary */}
          <View style={styles.reviewCard}>
            <Text style={styles.reviewCardTitle}>Deposit Summary</Text>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Property</Text>
              <Text style={styles.reviewValue} numberOfLines={2}>{propertyName}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Deposit Type</Text>
              <Text style={styles.reviewValue}>Security Deposit (Refundable)</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Set by Owner</Text>
              <Text style={styles.reviewValue}>Yes — agreed upon booking</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Payment Method</Text>
              <Text style={styles.reviewValue}>
                {selectedMethod ? methodLabel(selectedMethod) : "—"}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.reviewRow}>
              <Text style={styles.reviewTotalLabel}>Escrow Deposit Amount</Text>
              <Text style={styles.reviewTotalValue}>₱{ownerDepositAmount.toLocaleString()}</Text>
            </View>
          </View>

          {/* What happens to this money */}
          <View style={styles.escrowExplainCard}>
            <Text style={styles.escrowExplainTitle}>What happens to your money</Text>

            <View style={styles.escrowExplainRow}>
              <View style={[styles.escrowExplainDot, { backgroundColor: "#2563EB" }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.escrowExplainLabel}>Paid to PadFinder Escrow</Text>
                <Text style={styles.escrowExplainDesc}>NOT the owner — it's safely held by us</Text>
              </View>
              <Text style={styles.escrowExplainAmount}>₱{ownerDepositAmount.toLocaleString()}</Text>
            </View>

            <View style={styles.escrowExplainRow}>
              <View style={[styles.escrowExplainDot, { backgroundColor: "#059669" }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.escrowExplainLabel}>Returned to you on clean move-out</Text>
                <Text style={styles.escrowExplainDesc}>Owner confirms no damage → full refund</Text>
              </View>
              <Text style={[styles.escrowExplainAmount, { color: "#059669" }]}>
                UP TO ₱{ownerDepositAmount.toLocaleString()}
              </Text>
            </View>

            <View style={styles.escrowExplainRow}>
              <View style={[styles.escrowExplainDot, { backgroundColor: "#D97706" }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.escrowExplainLabel}>Deducted for damage/missing items</Text>
                <Text style={styles.escrowExplainDesc}>Owner must provide proof and itemized list</Text>
              </View>
              <Text style={[styles.escrowExplainAmount, { color: "#D97706" }]}>Varies</Text>
            </View>
          </View>

          {/* Refund Timeline */}
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Refund Timeline</Text>
            {[
              { icon: "home-outline", color: "#2563EB", label: "Move-out day", desc: "Notify PadFinder you've vacated the unit" },
              { icon: "clipboard-check-outline", color: "#7C3AED", label: "Owner inspects (within 3 days)", desc: "Owner submits inspection report" },
              { icon: "cash-outline", color: "#059669", label: "Deposit released (within 30 days)", desc: "Full or partial refund sent to your account" },
            ].map((item, i) => (
              <View key={i} style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: item.color + "20" }]}>
                  <Ionicons name={item.icon as any} size={16} color={item.color} />
                </View>
                {i < 2 && <View style={styles.timelineLine} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineLabel}>{item.label}</Text>
                  <Text style={styles.timelineDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Terms */}
          <View style={styles.termsBox}>
            <Text style={styles.termsText}>
              By confirming, you agree that this deposit is refundable subject to the unit's condition upon move-out. PadFinder's{" "}
              <Text style={styles.termsLink}>Escrow & Deposit Policy</Text>
              {" "}applies. You may dispute any deductions within 7 days of receiving the deduction report.
            </Text>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={submitDeposit}>
            <MaterialCommunityIcons name="shield-lock" size={18} color="#fff" />
            <Text style={styles.confirmBtnText}>
              Confirm Escrow Deposit — ₱{ownerDepositAmount.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── PROCESSING ───────────────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <View style={[styles.container, styles.centeredFull]}>
        <View style={styles.processingCard}>
          <View style={styles.processingIconWrap}>
            <MaterialCommunityIcons name="shield-lock" size={44} color="#1D4ED8" />
          </View>
          <Text style={styles.processingTitle}>Securing Your Deposit</Text>
          <Text style={styles.processingText}>
            Transferring ₱{ownerDepositAmount.toLocaleString()} to PadFinder escrow...
          </Text>
          <View style={styles.processingSteps}>
            {[
              "Encrypting transaction",
              "Verifying payment details",
              "Funding escrow account",
              "Notifying property owner",
            ].map((s, i) => (
              <View key={i} style={styles.processingStep}>
                <View style={styles.processingDot} />
                <Text style={styles.processingStepText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ─── SUCCESS ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 40 }]}>
        {/* Success */}
        <View style={styles.successIconWrap}>
          <View style={styles.successCircle}>
            <MaterialCommunityIcons name="shield-lock" size={52} color="#fff" />
          </View>
          <View style={styles.successCheckmark}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </View>
        </View>

        <Text style={styles.successTitle}>Deposit in Escrow!</Text>
        <Text style={styles.successSub}>
          Your ₱{ownerDepositAmount.toLocaleString()} security deposit is safely held by PadFinder. You'll get it back when you move out, as long as the unit is in good condition.
        </Text>

        {/* Receipt */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <MaterialCommunityIcons name="receipt" size={18} color="#1D4ED8" />
            <Text style={styles.receiptTitle}>Escrow Receipt</Text>
          </View>

          {[
            { label: "Transaction ID", value: transactionId },
            { label: "Property", value: propertyName },
            { label: "Deposit Amount", value: `₱${ownerDepositAmount.toLocaleString()}` },
            { label: "Payment Method", value: selectedMethod ? methodLabel(selectedMethod) : "—" },
            { label: "Held By", value: "PadFinder Escrow" },
            { label: "Status", value: "HELD IN ESCROW", highlight: true },
          ].map((row, i) => (
            <View key={i} style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{row.label}</Text>
              <Text style={[styles.receiptValue, row.highlight && styles.receiptValueHighlight]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Refund Conditions */}
        <View style={styles.refundCard}>
          <Text style={styles.refundTitle}>When Will You Get It Back?</Text>

          <View style={styles.refundScenario}>
            <View style={[styles.refundIcon, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="checkmark-circle" size={22} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.refundScenarioTitle, { color: "#059669" }]}>
                Full Refund — No Damage ✓
              </Text>
              <Text style={styles.refundScenarioDesc}>
                You get 100% of your deposit (₱{ownerDepositAmount.toLocaleString()}) back within 30 days of move-out if:
              </Text>
              <View style={styles.refundList}>
                {[
                  "No broken or damaged items",
                  "No missing furniture or appliances",
                  "Unit is clean and in original condition",
                  "All keys/access cards are returned",
                ].map((c, i) => (
                  <View key={i} style={styles.refundListRow}>
                    <Ionicons name="checkmark" size={13} color="#059669" />
                    <Text style={styles.refundListText}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.refundScenario, { marginBottom: 0 }]}>
            <View style={[styles.refundIcon, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="alert-circle" size={22} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.refundScenarioTitle, { color: "#D97706" }]}>
                Partial / No Refund — Damage Found ⚠
              </Text>
              <Text style={styles.refundScenarioDesc}>
                If there's damage, the owner deducts repair costs and returns the remainder. You'll receive an itemized deduction report and can dispute within 7 days.
              </Text>
            </View>
          </View>
        </View>

        {/* Dispute Note */}
        <View style={styles.disputeBox}>
          <Ionicons name="megaphone-outline" size={16} color="#1D4ED8" />
          <Text style={styles.disputeText}>
            If you believe a deduction is unfair, you can file a dispute through PadFinder. We will mediate between you and the owner and make a fair decision.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace("/tenant/home")}>
          <Ionicons name="home-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineBtn} onPress={() => router.replace("/tenant/approvals")}>
          <Text style={styles.outlineBtnText}>View My Bookings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centeredFull: { justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, paddingBottom: 48 },

  header: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    padding: 14, paddingTop: 18, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 8,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 12, color: "#64748B", marginTop: 1 },
  escrowBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#D1FAE5", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  escrowBadgeText: { fontSize: 11, fontWeight: "700", color: "#059669" },
  amountChip: { backgroundColor: "#1D4ED8", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  amountChipText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Hero
  heroBanner: { backgroundColor: "#1D4ED8", borderRadius: 18, padding: 20, alignItems: "center", marginBottom: 14 },
  heroIconWrap: { width: 72, height: 72, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 8 },
  heroSub: { fontSize: 13, color: "#BFDBFE", textAlign: "center", lineHeight: 20 },

  // Property Card
  propertyCard: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  propertyIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  propertyName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  propertyAddress: { fontSize: 12, color: "#64748B", marginTop: 2 },

  // Deposit Amount
  depositAmountCard: { backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1.5, borderColor: "#BFDBFE", shadowColor: "#1D4ED8", shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  depositAmountTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  depositAmountLabel: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  depositAmountNote: { fontSize: 11, color: "#94A3B8" },
  depositAmountValue: { fontSize: 36, fontWeight: "800", color: "#1D4ED8", marginBottom: 10 },
  depositAmountBottom: { flexDirection: "row", gap: 6, alignItems: "flex-start", backgroundColor: "#EFF6FF", borderRadius: 8, padding: 10 },
  depositAmountHint: { fontSize: 12, color: "#2563EB", flex: 1, lineHeight: 17 },

  // How It Works
  howCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  howTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 16 },
  howStep: { flexDirection: "row", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  howStepIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  howStepTitle: { fontSize: 13, fontWeight: "700", color: "#1E293B", marginBottom: 3 },
  howStepDesc: { fontSize: 12, color: "#64748B", lineHeight: 18 },

  // Rights
  rightsCard: { backgroundColor: "#F0FDF4", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#BBF7D0" },
  rightsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  rightsTitle: { fontSize: 14, fontWeight: "700", color: "#166534" },
  rightsRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  rightsText: { fontSize: 12, color: "#15803D", lineHeight: 18, flex: 1 },

  // Method Step
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 14 },
  methodCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: "#E2E8F0", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  methodCardActive: { borderColor: "#1D4ED8", backgroundColor: "#F0F7FF" },
  methodIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  methodIconBoxActive: { backgroundColor: "#1D4ED8" },
  methodLabel: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  methodLabelActive: { color: "#1D4ED8" },
  methodDesc: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  methodRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#CBD5E1" },
  secureRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F8FAFC", borderRadius: 8, padding: 10, marginBottom: 16 },
  secureText: { fontSize: 12, color: "#64748B", flex: 1 },

  // Details
  cashCard: { backgroundColor: "#F0FDF4", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#BBF7D0", alignItems: "center" },
  cashTitle: { fontSize: 16, fontWeight: "700", color: "#166534", marginTop: 8, marginBottom: 8 },
  cashText: { fontSize: 13, color: "#15803D", lineHeight: 20, textAlign: "center", marginBottom: 14 },
  cashDetail: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#BBF7D0" },
  cashDetailLabel: { fontSize: 12, color: "#64748B" },
  cashDetailValue: { fontSize: 13, fontWeight: "700", color: "#166534" },
  formCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  formCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  formCardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  formLabel: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 8 },
  formInput: { backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1E293B" },
  formRow: { flexDirection: "row" },
  formHint: { flexDirection: "row", gap: 6, alignItems: "flex-start", backgroundColor: "#EFF6FF", borderRadius: 8, padding: 10, marginTop: 10 },
  formHintText: { fontSize: 12, color: "#2563EB", flex: 1, lineHeight: 17 },
  cardAccepted: { fontSize: 12, color: "#94A3B8", marginTop: 10 },

  // Review
  reviewCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  reviewCardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 14 },
  reviewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  reviewLabel: { fontSize: 13, color: "#64748B" },
  reviewValue: { fontSize: 13, fontWeight: "600", color: "#1E293B", flex: 1, textAlign: "right" },
  reviewTotalLabel: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  reviewTotalValue: { fontSize: 22, fontWeight: "800", color: "#1D4ED8" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },

  escrowExplainCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  escrowExplainTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 14 },
  escrowExplainRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  escrowExplainDot: { width: 10, height: 10, borderRadius: 5 },
  escrowExplainLabel: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
  escrowExplainDesc: { fontSize: 11, color: "#64748B", marginTop: 1 },
  escrowExplainAmount: { fontSize: 13, fontWeight: "700", color: "#1E293B" },

  timelineCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  timelineTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 16 },
  timelineRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 6 },
  timelineDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  timelineLine: { position: "absolute", left: 17, top: 40, width: 2, height: 28, backgroundColor: "#E2E8F0" },
  timelineLabel: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
  timelineDesc: { fontSize: 12, color: "#64748B", marginTop: 2, lineHeight: 17 },

  termsBox: { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, marginBottom: 16 },
  termsText: { fontSize: 12, color: "#64748B", lineHeight: 18 },
  termsLink: { color: "#1D4ED8", fontWeight: "600" },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#059669", paddingVertical: 16, borderRadius: 14, marginBottom: 8 },
  confirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Processing
  processingCard: { alignItems: "center", padding: 32 },
  processingIconWrap: { width: 80, height: 80, borderRadius: 20, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  processingTitle: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
  processingText: { fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 24 },
  processingSteps: { gap: 12, width: "100%" },
  processingStep: { flexDirection: "row", alignItems: "center", gap: 10 },
  processingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#1D4ED8" },
  processingStepText: { fontSize: 13, color: "#64748B" },

  // Success
  successIconWrap: { alignItems: "center", marginBottom: 20, position: "relative" },
  successCircle: { width: 96, height: 96, borderRadius: 22, backgroundColor: "#059669", alignItems: "center", justifyContent: "center", shadowColor: "#059669", shadowOpacity: 0.35, shadowRadius: 18, elevation: 8 },
  successCheckmark: { position: "absolute", bottom: -4, right: "32%", width: 26, height: 26, borderRadius: 13, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  successTitle: { fontSize: 26, fontWeight: "800", color: "#0F172A", textAlign: "center", marginBottom: 8 },
  successSub: { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 20, marginBottom: 24, paddingHorizontal: 8 },

  // Receipt
  receiptCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  receiptHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  receiptTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  receiptLabel: { fontSize: 12, color: "#64748B" },
  receiptValue: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
  receiptValueHighlight: { color: "#D97706", backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },

  // Refund
  refundCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  refundTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 14 },
  refundScenario: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 14, padding: 12, borderRadius: 12, backgroundColor: "#F8FAFC" },
  refundIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  refundScenarioTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  refundScenarioDesc: { fontSize: 12, color: "#64748B", lineHeight: 17 },
  refundList: { marginTop: 8, gap: 4 },
  refundListRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  refundListText: { fontSize: 12, color: "#15803D" },

  // Dispute
  disputeBox: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: "#EFF6FF", borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: "#BFDBFE" },
  disputeText: { fontSize: 12, color: "#1D4ED8", flex: 1, lineHeight: 18 },

  // Buttons
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1D4ED8", paddingVertical: 15, borderRadius: 14, marginBottom: 10 },
  primaryBtnDisabled: { backgroundColor: "#94A3B8" },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  outlineBtn: { alignItems: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#CBD5E1", marginBottom: 8 },
  outlineBtnText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  ghostBtn: { alignItems: "center", paddingVertical: 12 },
  ghostBtnText: { fontSize: 14, color: "#94A3B8" },
});
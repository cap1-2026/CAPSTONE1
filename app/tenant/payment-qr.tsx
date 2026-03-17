import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { UserStorage } from "../../utils/userStorage";

function methodLabel(m: string) {
  if (m === "gcash") return "GCash";
  if (m === "card") return "Credit/Debit Card";
  if (m === "bank_transfer") return "Bank Transfer";
  return "Cash / Manual";
}

export default function PaymentQRPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    booking_id: string;
    transaction_id: string;
    property_name: string;
    property_address: string;
    amount: string;
    monthly_rent: string;
    payment_method: string;
  }>();

  const [tenantName, setTenantName] = useState("Tenant");

  const bookingId     = params.booking_id ?? "0";
  const txnId         = params.transaction_id ?? "—";
  const propertyName  = params.property_name ?? "Property";
  const propertyAddr  = params.property_address ?? "";
  const amount        = Number(params.amount ?? 0);
  const monthlyRent   = Number(params.monthly_rent ?? 0);
  const method        = params.payment_method ?? "cash";
  const today         = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });
  const refCode       = `PF-${bookingId.padStart(6, "0")}`;

  useEffect(() => {
    UserStorage.getUser("tenant").then((u) => { if (u) setTenantName(u.fullname); });
  }, []);

  // Build QR data string
  const qrData = [
    `PADFINDER TENANT QR`,
    `Ref: ${refCode}`,
    `Tenant: ${tenantName}`,
    `Property: ${propertyName}`,
    `Address: ${propertyAddr}`,
    `Deposit Paid: PHP ${amount.toLocaleString()}`,
    `Monthly Rent: PHP ${monthlyRent.toLocaleString()}`,
    `Date: ${today}`,
    `Status: VERIFIED`,
  ].join("\n");

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(qrData)}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <Ionicons name="home" size={16} color="#fff" />
          </View>
          <Text style={styles.logoText}>PadFinder</Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step 3 of 3</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={styles.progressStep}>
          <MaterialCommunityIcons name="file-document-outline" size={13} color="#94A3B8" />
          <Text style={styles.progressLabel}>Contract</Text>
        </View>
        <View style={[styles.progressConnector, { backgroundColor: "#2563EB" }]} />
        <View style={styles.progressStep}>
          <Ionicons name="card-outline" size={13} color="#94A3B8" />
          <Text style={styles.progressLabel}>Payment</Text>
        </View>
        <View style={[styles.progressConnector, { backgroundColor: "#2563EB" }]} />
        <View style={[styles.progressStep, styles.progressActive]}>
          <MaterialCommunityIcons name="qrcode" size={13} color="#fff" />
          <Text style={styles.progressLabelActive}>QR Code</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <View style={styles.successIconWrap}>
            <View style={styles.successCircle}>
              <MaterialCommunityIcons name="check-circle" size={48} color="#fff" />
            </View>
          </View>
          <Text style={styles.successTitle}>All Done!</Text>
          <Text style={styles.successSub}>
            Your deposit is secured. Save this QR code — it's your verified tenant access pass for {propertyName}.
          </Text>
        </View>

        {/* QR Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrCardHeader}>
            <MaterialCommunityIcons name="qrcode-scan" size={18} color="#1D4ED8" />
            <Text style={styles.qrCardTitle}>Tenant Access QR Code</Text>
          </View>

          <View style={styles.qrWrapper}>
            <Image
              source={{ uri: qrUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.qrRefRow}>
            <Text style={styles.qrRefLabel}>Reference Code</Text>
            <Text style={styles.qrRefValue}>{refCode}</Text>
          </View>

          <View style={styles.qrInfoRow}>
            <Ionicons name="person-outline" size={13} color="#64748B" />
            <Text style={styles.qrInfoText}>{tenantName}</Text>
          </View>
          <View style={styles.qrInfoRow}>
            <Ionicons name="home-outline" size={13} color="#64748B" />
            <Text style={styles.qrInfoText}>{propertyName}</Text>
          </View>
          <View style={styles.qrInfoRow}>
            <MaterialCommunityIcons name="shield-check" size={13} color="#059669" />
            <Text style={[styles.qrInfoText, { color: "#059669", fontWeight: "700" }]}>VERIFIED TENANT</Text>
          </View>
        </View>

        {/* Receipt Summary */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <MaterialCommunityIcons name="receipt" size={16} color="#1D4ED8" />
            <Text style={styles.receiptTitle}>Payment Receipt</Text>
          </View>

          {[
            { label: "Transaction ID",   value: txnId },
            { label: "Property",         value: propertyName },
            { label: "Tenant",           value: tenantName },
            { label: "Deposit Paid",     value: `₱${amount.toLocaleString()}`, highlight: true },
            { label: "Monthly Rent",     value: `₱${monthlyRent.toLocaleString()}` },
            { label: "Payment Method",   value: methodLabel(method) },
            { label: "Date",             value: today },
            { label: "Held By",          value: "PadFinder Escrow" },
            { label: "Status",           value: "PAID — IN ESCROW", status: true },
          ].map((row, i) => (
            <View key={i} style={[styles.receiptRow, i % 2 === 1 && styles.receiptRowAlt]}>
              <Text style={styles.receiptLabel}>{row.label}</Text>
              <Text style={[
                styles.receiptValue,
                row.highlight && styles.receiptHighlight,
                row.status && styles.receiptStatus,
              ]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Tip */}
        <View style={styles.tipBox}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#D97706" />
          <Text style={styles.tipText}>
            <Text style={{ fontWeight: "700" }}>Tip:</Text> Screenshot or download this QR code. You may be asked to show it when moving in or for property access verification.
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace("/tenant/contracts")}
        >
          <MaterialCommunityIcons name="file-document-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>View My Contracts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => router.replace("/tenant/home")}
        >
          <Ionicons name="home-outline" size={18} color="#2563EB" />
          <Text style={styles.outlineBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={{ height: 36 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#F1F5F9" },

  // Header
  header:          { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerLeft:      { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon:        { width: 30, height: 30, borderRadius: 8, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center" },
  logoText:        { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  stepBadge:       { backgroundColor: "#D1FAE5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stepBadgeText:   { fontSize: 11, fontWeight: "700", color: "#059669" },

  // Progress
  progressBar:     { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  progressStep:    { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, justifyContent: "center" },
  progressActive:  { backgroundColor: "#059669", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  progressLabel:   { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  progressLabelActive: { fontSize: 11, color: "#fff", fontWeight: "700" },
  progressConnector: { width: 28, height: 2, backgroundColor: "#E2E8F0" },

  // Scroll
  scrollContent:   { padding: 14, paddingBottom: 20 },

  // Success Banner
  successBanner:   { backgroundColor: "#fff", borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#D1FAE5" },
  successIconWrap: { marginBottom: 12 },
  successCircle:   { width: 76, height: 76, borderRadius: 38, backgroundColor: "#059669", alignItems: "center", justifyContent: "center", shadowColor: "#059669", shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  successTitle:    { fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  successSub:      { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 19 },

  // QR Card
  qrCard:          { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: "#DBEAFE", alignItems: "center" },
  qrCardHeader:    { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 },
  qrCardTitle:     { fontSize: 14, fontWeight: "800", color: "#1D4ED8" },
  qrWrapper:       { width: 250, height: 250, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 8, alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  qrImage:         { width: 232, height: 232 },
  qrRefRow:        { backgroundColor: "#EFF6FF", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 10, alignItems: "center" },
  qrRefLabel:      { fontSize: 10, color: "#64748B", fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  qrRefValue:      { fontSize: 16, fontWeight: "800", color: "#1D4ED8", letterSpacing: 2 },
  qrInfoRow:       { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  qrInfoText:      { fontSize: 12, color: "#64748B", fontWeight: "600" },

  // Receipt
  receiptCard:     { backgroundColor: "#fff", borderRadius: 14, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  receiptHeader:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EFF6FF", padding: 12 },
  receiptTitle:    { fontSize: 13, fontWeight: "800", color: "#1D4ED8" },
  receiptRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#fff" },
  receiptRowAlt:   { backgroundColor: "#F8FAFC" },
  receiptLabel:    { fontSize: 12, color: "#64748B", fontWeight: "600" },
  receiptValue:    { fontSize: 12, fontWeight: "700", color: "#1E293B" },
  receiptHighlight: { color: "#059669", fontSize: 14 },
  receiptStatus:   { color: "#2563EB", fontWeight: "800" },

  // Tip
  tipBox:          { flexDirection: "row", gap: 8, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 10, padding: 12, marginBottom: 14, alignItems: "flex-start" },
  tipText:         { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 18 },

  // Buttons
  primaryBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#2563EB", paddingVertical: 14, borderRadius: 14, marginBottom: 10, shadowColor: "#2563EB", shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  primaryBtnText:  { fontSize: 14, fontWeight: "800", color: "#fff" },
  outlineBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: "#2563EB", marginBottom: 10 },
  outlineBtnText:  { fontSize: 14, fontWeight: "700", color: "#2563EB" },
});

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

function showAlert(title: string, msg?: string) {
  if (Platform.OS === "web") window.alert(msg ? `${title}\n\n${msg}` : title);
  else Alert.alert(title, msg);
}

export default function LeaseContractPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    booking_id: string;
    amount: string;
    property_name: string;
    property_address: string;
    monthly_rent: string;
    move_in: string;
    lease_duration: string;
    created_at: string;
  }>();

  const [tenantName, setTenantName] = useState("Tenant");
  const [agreed, setAgreed]         = useState(false);
  const [facePhoto, setFacePhoto]   = useState<any>(null);
  const [idPhoto, setIdPhoto]       = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const propertyName  = params.property_name   ?? "Property";
  const propertyAddr  = params.property_address ?? "";
  const monthlyRent   = Number(params.monthly_rent ?? 0);
  const depositAmount = Number(params.amount ?? monthlyRent);
  const moveIn        = params.move_in ?? "—";
  const leaseDuration = params.lease_duration ?? "—";
  const bookingId     = params.booking_id ?? "";
  const today         = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    UserStorage.getUser("tenant").then((u) => { if (u) setTenantName(u.fullname); });
  }, []);

  async function pickPhoto(type: "face" | "id") {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission needed", "Allow photo access to upload.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (type === "face") setFacePhoto(result.assets[0]);
      else setIdPhoto(result.assets[0]);
    }
  }

  async function appendPhoto(form: FormData, key: string, photo: any) {
    if (!photo) return;
    if (Platform.OS === "web") {
      try {
        const resp = await fetch(photo.uri);
        const blob = await resp.blob();
        form.append(key, blob, `${key}_${Date.now()}.jpg`);
      } catch {}
    } else {
      (form as any).append(key, {
        uri:  photo.uri,
        name: photo.fileName || `${key}_${Date.now()}.jpg`,
        type: photo.mimeType || "image/jpeg",
      });
    }
  }

  async function handleProceed() {
    if (!agreed) {
      showAlert("Agreement Required", "Please read and agree to the contract terms before proceeding.");
      return;
    }
    if (!facePhoto) {
      showAlert("Photo Required", "Please upload a selfie (face photo) for identity verification.");
      return;
    }
    if (!idPhoto) {
      showAlert("ID Required", "Please upload a photo of your valid ID.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("booking_id", bookingId);
      await appendPhoto(form, "face_photo", facePhoto);
      await appendPhoto(form, "id_photo",   idPhoto);

      const res  = await fetch(API_ENDPOINTS.SUBMIT_CONTRACT, { method: "POST", body: form });
      const data = await res.json();

      if (data.status === "success") {
        router.replace("/tenant/approvals" as any);
      } else {
        showAlert("Submission Failed", data.message || "Please try again.");
      }
    } catch {
      showAlert("Connection Error", "Cannot reach the server. Make sure XAMPP is running.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Lease Contract</Text>
          <Text style={styles.headerSub}>Read carefully before signing</Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step 2 of 4</Text>
        </View>
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.progressBar}>
        <View style={styles.progressStep}>
          <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
          <Text style={[styles.progressLabel, { color: "#16A34A" }]}>Booking</Text>
        </View>
        <View style={[styles.progressConnector, { backgroundColor: "#16A34A" }]} />
        <View style={[styles.progressStep, styles.progressActive]}>
          <MaterialCommunityIcons name="file-document-outline" size={14} color="#fff" />
          <Text style={styles.progressLabelActive}>Contract</Text>
        </View>
        <View style={styles.progressConnector} />
        <View style={styles.progressStep}>
          <Ionicons name="card-outline" size={14} color="#94A3B8" />
          <Text style={styles.progressLabel}>Payment</Text>
        </View>
        <View style={styles.progressConnector} />
        <View style={styles.progressStep}>
          <MaterialCommunityIcons name="qrcode" size={14} color="#94A3B8" />
          <Text style={styles.progressLabel}>QR Code</Text>
        </View>
      </View>

      {/* ── Contract Document ── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>

        {/* Document Header */}
        <View style={styles.docHeader}>
          <View style={styles.docLogo}>
            <Ionicons name="home" size={22} color="#fff" />
          </View>
          <Text style={styles.docCompany}>PadFinder</Text>
          <Text style={styles.docTitle}>RESIDENTIAL LEASE AGREEMENT</Text>
          <View style={styles.docDividerThick} />
          <Text style={styles.docRef}>Contract Ref: PF-{bookingId.padStart(6, "0")}</Text>
          <Text style={styles.docDate}>Date: {today}</Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTIES TO THIS AGREEMENT</Text>
          <View style={styles.partyCard}>
            <View style={[styles.partyTag, { backgroundColor: "#DBEAFE" }]}>
              <Text style={[styles.partyTagText, { color: "#1D4ED8" }]}>LESSOR (Owner)</Text>
            </View>
            <Text style={styles.partyLabel}>Property Owner / Landlord</Text>
            <Text style={styles.partyValue}>Owner of {propertyName}</Text>
            <Text style={styles.partyNote}>Contact details provided upon contract finalization.</Text>
          </View>
          <View style={styles.partyCard}>
            <View style={[styles.partyTag, { backgroundColor: "#D1FAE5" }]}>
              <Text style={[styles.partyTagText, { color: "#059669" }]}>LESSEE (Tenant)</Text>
            </View>
            <Text style={styles.partyLabel}>Tenant / Occupant</Text>
            <Text style={styles.partyValue}>{tenantName}</Text>
            <Text style={styles.partyNote}>As registered in PadFinder account.</Text>
          </View>
        </View>

        {/* Property Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROPERTY DETAILS</Text>
          <View style={styles.detailTable}>
            {[
              { label: "Property Name", value: propertyName },
              { label: "Full Address",  value: propertyAddr },
              { label: "Type",          value: "Residential Unit" },
            ].map((row, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <Text style={styles.tableLabel}>{row.label}</Text>
                <Text style={styles.tableValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Lease Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEASE TERMS</Text>
          <View style={styles.detailTable}>
            {[
              { label: "Move-In Date",     value: moveIn },
              { label: "Lease Duration",   value: leaseDuration },
              { label: "Monthly Rent",     value: `₱${monthlyRent.toLocaleString()}` },
              { label: "Security Deposit", value: `₱${depositAmount.toLocaleString()}` },
              { label: "Rent Due",         value: "1st of every month" },
              { label: "Late Fee",         value: "₱200/day after 5-day grace period" },
            ].map((row, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <Text style={styles.tableLabel}>{row.label}</Text>
                <Text style={[styles.tableValue, row.label === "Monthly Rent" && styles.tableValueHighlight]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TERMS AND CONDITIONS</Text>
          {[
            { num: "1",  title: "PAYMENT OF RENT",        body: `The Lessee agrees to pay the monthly rent of ₱${monthlyRent.toLocaleString()} on or before the 1st day of each month. A grace period of five (5) days is provided. Payments made after the grace period are subject to a late fee of ₱200 per day.` },
            { num: "2",  title: "SECURITY DEPOSIT",       body: `A security deposit of ₱${depositAmount.toLocaleString()} shall be held in PadFinder Escrow. This amount will be returned within thirty (30) days after the Lessee vacates the property, subject to deductions for damages beyond normal wear and tear.` },
            { num: "3",  title: "USE OF PREMISES",        body: "The leased property shall be used exclusively for residential purposes. The Lessee shall not use the premises for any illegal activity, commercial operations, or sub-letting without the prior written consent of the Lessor." },
            { num: "4",  title: "MAINTENANCE AND REPAIRS",body: "The Lessee shall keep the premises clean and in good condition. Minor repairs (under ₱500) are the Lessee's responsibility. Major structural repairs are the Lessor's responsibility." },
            { num: "5",  title: "TERMINATION OF LEASE",   body: "Either party may terminate this agreement by providing thirty (30) days written notice. Early termination by the Lessee may result in forfeiture of the security deposit." },
            { num: "6",  title: "ENTRY AND INSPECTION",   body: "The Lessor reserves the right to enter the property with twenty-four (24) hours advance notice for inspections, repairs, or showings." },
            { num: "7",  title: "UTILITIES",              body: "The Lessee shall be responsible for all utility bills including electricity, water, internet, and cable unless otherwise agreed." },
            { num: "8",  title: "PETS AND ALTERATIONS",   body: "No pets are allowed without prior written consent of the Lessor. No structural alterations may be made without written approval." },
            { num: "9",  title: "RENEWAL",                body: "This lease may be renewed upon mutual written agreement at least thirty (30) days before the expiration date." },
            { num: "10", title: "GOVERNING LAW",          body: "This agreement shall be governed by the laws of the Republic of the Philippines. Any disputes shall first be resolved through PadFinder mediation." },
          ].map((clause) => (
            <View key={clause.num} style={styles.clause}>
              <View style={styles.clauseNumBadge}>
                <Text style={styles.clauseNum}>{clause.num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clauseTitle}>{clause.title}</Text>
                <Text style={styles.clauseBody}>{clause.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Signature Block */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SIGNATURES</Text>
          <Text style={styles.signatureNote}>
            By agreeing below, both parties confirm they have read, understood, and accept all terms.
          </Text>
          <View style={styles.signaturesRow}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Lessor / Property Owner</Text>
              <Text style={styles.signatureName}>Owner of {propertyName}</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={[styles.signatureLine, { borderColor: "#2563EB" }]} />
              <Text style={styles.signatureLabel}>Lessee / Tenant</Text>
              <Text style={[styles.signatureName, { color: "#2563EB", fontWeight: "700" }]}>{tenantName}</Text>
            </View>
          </View>
          <View style={styles.effectiveBox}>
            <Ionicons name="calendar-outline" size={14} color="#059669" />
            <Text style={styles.effectiveText}>
              This contract takes effect on <Text style={{ fontWeight: "700" }}>{moveIn}</Text>
            </Text>
          </View>
        </View>

        {/* ── Identity Verification Photos ── */}
        <View style={[styles.section, styles.photoSection]}>
          <Text style={styles.sectionTitle}>IDENTITY VERIFICATION</Text>
          <Text style={styles.photoIntro}>
            Upload a selfie and a photo of your valid government ID. The owner will review these before approving the contract.
          </Text>

          <Text style={styles.photoLabel}>Selfie / Face Photo <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.photoBox, facePhoto && styles.photoBoxDone]}
            onPress={() => pickPhoto("face")}
          >
            {facePhoto ? (
              <View style={styles.photoPreviewRow}>
                <Image source={{ uri: facePhoto.uri }} style={styles.photoPreview} />
                <View>
                  <Text style={styles.photoDoneText}>✓ Face Photo Uploaded</Text>
                  <Text style={styles.photoChangeText}>Tap to change</Text>
                </View>
              </View>
            ) : (
              <>
                <Ionicons name="person-circle-outline" size={28} color="#64748B" />
                <Text style={styles.photoHint}>Tap to upload a selfie</Text>
                <Text style={styles.photoSubHint}>Clear face, good lighting</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.photoLabel, { marginTop: 12 }]}>Valid Government ID <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.photoBox, idPhoto && styles.photoBoxDone]}
            onPress={() => pickPhoto("id")}
          >
            {idPhoto ? (
              <View style={styles.photoPreviewRow}>
                <Image source={{ uri: idPhoto.uri }} style={styles.photoPreview} />
                <View>
                  <Text style={styles.photoDoneText}>✓ ID Photo Uploaded</Text>
                  <Text style={styles.photoChangeText}>Tap to change</Text>
                </View>
              </View>
            ) : (
              <>
                <Ionicons name="card-outline" size={28} color="#64748B" />
                <Text style={styles.photoHint}>Tap to upload your ID</Text>
                <Text style={styles.photoSubHint}>Passport, Driver's License, PhilSys, etc.</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Agreement Checkbox */}
        <View style={styles.agreeSection}>
          <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed((v) => !v)} activeOpacity={0.7}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.agreeText}>
              I, <Text style={{ fontWeight: "700" }}>{tenantName}</Text>, have fully read and understood all terms and conditions of this Residential Lease Agreement and agree to be legally bound by them.
            </Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.proceedBtn, (!agreed || !facePhoto || !idPhoto || submitting) && styles.proceedBtnDisabled]}
          onPress={handleProceed}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={18} color="#fff" />
              <Text style={styles.proceedBtnText}>Submit Contract for Owner Review</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Go Back</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#F1F5F9" },

  header:          { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 14, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 10 },
  headerTitle:     { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  headerSub:       { fontSize: 11, color: "#64748B", marginTop: 1 },
  stepBadge:       { backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stepBadgeText:   { fontSize: 11, fontWeight: "700", color: "#2563EB" },

  progressBar:     { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  progressStep:    { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, justifyContent: "center" },
  progressActive:  { backgroundColor: "#2563EB", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  progressLabel:   { fontSize: 10, color: "#94A3B8", fontWeight: "600" },
  progressLabelActive: { fontSize: 10, color: "#fff", fontWeight: "700" },
  progressConnector: { width: 20, height: 2, backgroundColor: "#E2E8F0" },

  scroll:          { flex: 1 },
  scrollContent:   { padding: 14, paddingBottom: 20 },

  docHeader:       { backgroundColor: "#fff", borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#DBEAFE" },
  docLogo:         { width: 50, height: 50, borderRadius: 12, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  docCompany:      { fontSize: 13, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1.5, marginBottom: 4 },
  docTitle:        { fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: 0.5, textAlign: "center" },
  docDividerThick: { width: 60, height: 3, backgroundColor: "#1D4ED8", borderRadius: 2, marginVertical: 10 },
  docRef:          { fontSize: 12, color: "#64748B", fontWeight: "600" },
  docDate:         { fontSize: 12, color: "#64748B", marginTop: 2 },

  section:         { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  sectionTitle:    { fontSize: 11, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1.2, marginBottom: 12 },

  partyCard:       { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  partyTag:        { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  partyTagText:    { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  partyLabel:      { fontSize: 11, color: "#94A3B8", marginBottom: 2 },
  partyValue:      { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  partyNote:       { fontSize: 11, color: "#94A3B8", marginTop: 3, fontStyle: "italic" },

  detailTable:     { borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0" },
  tableRow:        { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff" },
  tableRowAlt:     { backgroundColor: "#F8FAFC" },
  tableLabel:      { flex: 1, fontSize: 12, color: "#64748B", fontWeight: "600" },
  tableValue:      { flex: 1.2, fontSize: 12, fontWeight: "700", color: "#1E293B", textAlign: "right" },
  tableValueHighlight: { color: "#059669", fontSize: 13 },

  clause:          { flexDirection: "row", gap: 10, marginBottom: 14 },
  clauseNumBadge:  { width: 24, height: 24, borderRadius: 12, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
  clauseNum:       { fontSize: 11, fontWeight: "800", color: "#fff" },
  clauseTitle:     { fontSize: 12, fontWeight: "800", color: "#0F172A", marginBottom: 4, letterSpacing: 0.3 },
  clauseBody:      { fontSize: 12, color: "#475569", lineHeight: 19 },

  signatureNote:   { fontSize: 12, color: "#64748B", lineHeight: 18, marginBottom: 14, fontStyle: "italic" },
  signaturesRow:   { flexDirection: "row", gap: 10, marginBottom: 12 },
  signatureBox:    { flex: 1, alignItems: "center" },
  signatureLine:   { width: "100%", height: 1, borderBottomWidth: 2, borderColor: "#CBD5E1", borderStyle: "dashed", marginBottom: 8 },
  signatureLabel:  { fontSize: 11, color: "#94A3B8", marginBottom: 2 },
  signatureName:   { fontSize: 12, fontWeight: "600", color: "#1E293B", textAlign: "center" },
  effectiveBox:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#D1FAE5", padding: 10, borderRadius: 8 },
  effectiveText:   { fontSize: 12, color: "#065F46" },

  photoSection:    { borderColor: "#BFDBFE", borderWidth: 1.5 },
  photoIntro:      { fontSize: 12, color: "#475569", lineHeight: 18, marginBottom: 14 },
  photoLabel:      { fontSize: 12, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
  required:        { color: "#DC2626" },
  photoBox:        { borderWidth: 1.5, borderColor: "#CBD5E1", borderStyle: "dashed", borderRadius: 12, padding: 16, alignItems: "center", gap: 6 },
  photoBoxDone:    { borderColor: "#16A34A", backgroundColor: "#F0FDF4", borderStyle: "solid" },
  photoPreviewRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  photoPreview:    { width: 60, height: 60, borderRadius: 8, backgroundColor: "#E2E8F0" },
  photoDoneText:   { fontSize: 13, fontWeight: "700", color: "#16A34A" },
  photoChangeText: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  photoHint:       { fontSize: 13, color: "#64748B" },
  photoSubHint:    { fontSize: 11, color: "#94A3B8" },

  agreeSection:    { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 2, borderColor: "#E2E8F0" },
  agreeRow:        { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox:        { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
  checkboxChecked: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  agreeText:       { flex: 1, fontSize: 13, color: "#334155", lineHeight: 20 },

  proceedBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#2563EB", paddingVertical: 15, borderRadius: 14, marginBottom: 10 },
  proceedBtnDisabled: { backgroundColor: "#94A3B8" },
  proceedBtnText:     { fontSize: 15, fontWeight: "800", color: "#fff" },
  cancelBtn:          { alignItems: "center", paddingVertical: 12 },
  cancelBtnText:      { fontSize: 14, color: "#94A3B8", fontWeight: "600" },
});

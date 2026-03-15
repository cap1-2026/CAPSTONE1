// app/tenant/booking/[id].tsx
// Tenant books a property — sends multipart/form-data to book_room.php
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import API_ENDPOINTS from "../../../config/api";
import { UserStorage } from "../../../utils/userStorage";

const LEASE_OPTIONS = ["1 month", "3 months", "6 months", "12 months", "24 months"];
const ID_TYPES = ["Passport", "Driver's License", "National ID (PhilSys)", "SSS ID", "GSIS ID", "Voter's ID", "PRC ID"];

export default function BookingPage() {
  const router = useRouter();
  const { id: propertyId } = useLocalSearchParams<{ id: string }>();

  const [property, setProperty]   = useState<any>(null);
  const [loadingProp, setLoadingProp] = useState(true);
  const [submitting, setSubmitting]   = useState(false);

  // Form fields
  const [fullName, setFullName]         = useState("");
  const [email, setEmail]               = useState("");
  const [phone, setPhone]               = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [idType, setIdType]             = useState("");
  const [showIdTypeMenu, setShowIdTypeMenu] = useState(false);
  const [idNumber, setIdNumber]         = useState("");
  const [idImage, setIdImage]           = useState<any>(null);
  const [emergencyName, setEmergencyName]   = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [moveIn, setMoveIn]             = useState("");
  const [leaseDuration, setLeaseDuration]   = useState("12 months");
  const [showLeaseMenu, setShowLeaseMenu]   = useState(false);
  const [occupants, setOccupants]       = useState("1");
  const [specialRequest, setSpecialRequest] = useState("");

  // Pre-fill from stored user
  useEffect(() => {
    UserStorage.getUser().then((u) => {
      if (u) { setFullName(u.fullname); setEmail(u.email); }
    });
  }, []);

  // Load property details
  useEffect(() => {
    if (!propertyId) return;
    fetch(`${API_ENDPOINTS.GET_PROPERTIES}?property_id=${propertyId}`)
      .then((r) => r.json())
      .then((d) => { if (d.status === "success") setProperty(d.data); })
      .catch(() => {})
      .finally(() => setLoadingProp(false));
  }, [propertyId]);

  async function pickIdImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Allow photo access to upload your ID."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setIdImage(result.assets[0]);
  }

  function validate(): boolean {
    if (!fullName.trim())    { Alert.alert("Missing", "Full name is required."); return false; }
    if (!email.trim())       { Alert.alert("Missing", "Email is required."); return false; }
    if (!phone.trim())       { Alert.alert("Missing", "Phone number is required."); return false; }
    if (!currentAddress.trim()) { Alert.alert("Missing", "Current address is required."); return false; }
    if (!idType)             { Alert.alert("Missing", "Please select an ID type."); return false; }
    if (!idNumber.trim())    { Alert.alert("Missing", "ID number is required."); return false; }
    if (!moveIn.trim())      { Alert.alert("Missing", "Move-in date is required (YYYY-MM-DD)."); return false; }
    return true;
  }

  async function submitBooking() {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const user = await UserStorage.getUser();
      if (!user) { Alert.alert("Error", "Please log in first."); setSubmitting(false); return; }

      const form = new FormData();
      form.append("tenant_id",       String(user.user_id));
      form.append("property_id",     String(propertyId));
      form.append("full_name",        fullName);
      form.append("email",            email);
      form.append("phone",            phone);
      form.append("current_address",  currentAddress);
      form.append("id_type",          idType);
      form.append("id_number",        idNumber);
      form.append("emergency_contact_name",  emergencyName);
      form.append("emergency_contact_phone", emergencyPhone);
      form.append("move_in",          moveIn);
      form.append("lease_duration",   leaseDuration);
      form.append("duration",         leaseDuration.split(" ")[0]);
      form.append("occupants",        occupants);
      form.append("special_request",  specialRequest);

      if (idImage) {
        const uri  = idImage.uri;
        const name = idImage.fileName || `id_${Date.now()}.jpg`;
        const type = idImage.mimeType || "image/jpeg";
        (form as any).append("id_image", { uri, name, type });
      }

      const res  = await fetch(API_ENDPOINTS.BOOK_ROOM, { method: "POST", body: form });
      const data = await res.json();

      if (data.status === "success") {
        router.replace("/tenant/pending-approval");
      } else {
        Alert.alert("Booking Failed", data.message || "Please try again.");
      }
    } catch (err) {
      Alert.alert("Connection Error", "Cannot reach the server. Make sure XAMPP is running.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingProp) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Book Property</Text>
          {property && <Text style={styles.headerSub} numberOfLines={1}>{property.name}</Text>}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Property Summary */}
        {property && (
          <View style={styles.propCard}>
            <Ionicons name="home" size={20} color="#1D4ED8" />
            <View style={{ flex: 1 }}>
              <Text style={styles.propName}>{property.name}</Text>
              <Text style={styles.propAddress}>{property.address}</Text>
            </View>
            <Text style={styles.propPrice}>₱{Number(property.price).toLocaleString()}/mo</Text>
          </View>
        )}

        {/* Section: Personal Info */}
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Juan Dela Cruz" />

        <Text style={styles.label}>Email Address *</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="juan@example.com" />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="09XX XXX XXXX" />

        <Text style={styles.label}>Current Address *</Text>
        <TextInput style={[styles.input, styles.textArea]} value={currentAddress} onChangeText={setCurrentAddress} multiline placeholder="House / Unit No., Street, Barangay, City" />

        {/* Section: ID Verification */}
        <Text style={styles.sectionTitle}>ID Verification</Text>

        <Text style={styles.label}>ID Type *</Text>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowIdTypeMenu(!showIdTypeMenu)}>
          <Text style={[styles.dropdownBtnText, !idType && styles.placeholder]}>{idType || "Select ID type"}</Text>
          <Ionicons name={showIdTypeMenu ? "chevron-up" : "chevron-down"} size={16} color="#94A3B8" />
        </TouchableOpacity>
        {showIdTypeMenu && (
          <View style={styles.dropdownMenu}>
            {ID_TYPES.map((t) => (
              <TouchableOpacity key={t} style={styles.dropdownItem} onPress={() => { setIdType(t); setShowIdTypeMenu(false); }}>
                <Text style={[styles.dropdownItemText, idType === t && styles.dropdownItemActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>ID Number *</Text>
        <TextInput style={styles.input} value={idNumber} onChangeText={setIdNumber} placeholder="Enter your ID number" />

        <Text style={styles.label}>Upload ID Photo (optional)</Text>
        <TouchableOpacity style={[styles.uploadBox, idImage && styles.uploadBoxDone]} onPress={pickIdImage}>
          {idImage ? (
            <View style={styles.uploadPreviewRow}>
              <Image source={{ uri: idImage.uri }} style={styles.uploadPreview} />
              <View><Text style={styles.uploadDoneText}>✓ ID Photo Uploaded</Text><Text style={styles.uploadChangeText}>Tap to change</Text></View>
            </View>
          ) : (
            <>
              <Ionicons name="camera-outline" size={22} color="#64748B" />
              <Text style={styles.uploadText}>Tap to upload your ID photo</Text>
              <Text style={styles.uploadHint}>JPG or PNG</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Section: Emergency Contact */}
        <Text style={styles.sectionTitle}>Emergency Contact</Text>

        <Text style={styles.label}>Contact Name</Text>
        <TextInput style={styles.input} value={emergencyName} onChangeText={setEmergencyName} placeholder="Maria Dela Cruz" />

        <Text style={styles.label}>Contact Phone</Text>
        <TextInput style={styles.input} value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" placeholder="09XX XXX XXXX" />

        {/* Section: Lease Details */}
        <Text style={styles.sectionTitle}>Lease Details</Text>

        <Text style={styles.label}>Move-in Date * (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={moveIn} onChangeText={setMoveIn} placeholder="2026-04-01" />

        <Text style={styles.label}>Lease Duration *</Text>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowLeaseMenu(!showLeaseMenu)}>
          <Text style={styles.dropdownBtnText}>{leaseDuration}</Text>
          <Ionicons name={showLeaseMenu ? "chevron-up" : "chevron-down"} size={16} color="#94A3B8" />
        </TouchableOpacity>
        {showLeaseMenu && (
          <View style={styles.dropdownMenu}>
            {LEASE_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => { setLeaseDuration(opt); setShowLeaseMenu(false); }}>
                <Text style={[styles.dropdownItemText, leaseDuration === opt && styles.dropdownItemActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Number of Occupants</Text>
        <TextInput style={styles.input} value={occupants} onChangeText={setOccupants} keyboardType="number-pad" placeholder="1" />

        <Text style={styles.label}>Special Requests / Notes</Text>
        <TextInput style={[styles.input, styles.textArea]} value={specialRequest} onChangeText={setSpecialRequest} multiline placeholder="Pets, parking needs, etc." />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={submitBooking}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <><Ionicons name="checkmark-circle-outline" size={20} color="#fff" /><Text style={styles.submitBtnText}>Submit Booking Request</Text></>}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Your booking is pending until the owner reviews and approves it. You will be notified of the decision.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center:        { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
  loadingText:   { marginTop: 12, color: "#64748B" },
  header:        { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, paddingTop: 18, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 8 },
  backBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  headerTitle:   { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  headerSub:     { fontSize: 12, color: "#64748B", marginTop: 1 },
  content:       { padding: 16, paddingBottom: 40 },
  propCard:      { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#EFF6FF", borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: "#BFDBFE" },
  propName:      { fontSize: 14, fontWeight: "700", color: "#1E3A8A" },
  propAddress:   { fontSize: 12, color: "#3B82F6", marginTop: 2 },
  propPrice:     { fontSize: 14, fontWeight: "800", color: "#1D4ED8" },
  sectionTitle:  { fontSize: 15, fontWeight: "700", color: "#1D4ED8", marginTop: 20, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  label:         { fontSize: 13, fontWeight: "600", color: "#374151", marginTop: 10, marginBottom: 4 },
  input:         { backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#1E293B" },
  textArea:      { minHeight: 80, textAlignVertical: "top" },
  dropdownBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14, paddingVertical: 11 },
  dropdownBtnText:{ fontSize: 14, color: "#1E293B" },
  placeholder:   { color: "#94A3B8" },
  dropdownMenu:  { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", marginTop: 4, marginBottom: 8, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  dropdownItem:  { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  dropdownItemText: { fontSize: 14, color: "#374151" },
  dropdownItemActive: { color: "#1D4ED8", fontWeight: "700" },
  uploadBox:     { borderWidth: 1.5, borderColor: "#CBD5E1", borderStyle: "dashed", borderRadius: 12, padding: 16, alignItems: "center", gap: 6, marginTop: 4 },
  uploadBoxDone: { borderColor: "#059669", backgroundColor: "#F0FDF4" },
  uploadPreviewRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  uploadPreview: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#E2E8F0" },
  uploadDoneText:{ fontSize: 14, fontWeight: "700", color: "#059669" },
  uploadChangeText: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  uploadText:    { fontSize: 14, color: "#64748B" },
  uploadHint:    { fontSize: 12, color: "#94A3B8" },
  submitBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1D4ED8", paddingVertical: 15, borderRadius: 14, marginTop: 28 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disclaimer:    { textAlign: "center", fontSize: 12, color: "#94A3B8", marginTop: 14, lineHeight: 18 },
});
// app/tenant/booking/[id].tsx
// Tenant books a property — sends multipart/form-data to book_room.php
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import API_ENDPOINTS from "../../../config/api";
import { UserStorage } from "../../../utils/userStorage";

const ID_TYPES = ["Passport", "Driver's License", "National ID (PhilSys)", "SSS ID", "GSIS ID", "Voter's ID", "PRC ID"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS     = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Inline Calendar Component ────────────────────────────────────────────────
function CalendarPicker({ selectedDate, minDate, onSelect }: {
  selectedDate: Date | null;
  minDate: Date;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startYear  = minDate.getFullYear();
  const startMonth = minDate.getMonth();

  const [viewYear,  setViewYear]  = useState(startYear);
  const [viewMonth, setViewMonth] = useState(startMonth);

  function prevMonth() {
    let m = viewMonth - 1, y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (y < startYear || (y === startYear && m < startMonth)) return;
    setViewYear(y); setViewMonth(m);
  }
  function nextMonth() {
    let m = viewMonth + 1, y = viewYear;
    if (m > 11) { m = 0; y++; }
    setViewYear(y); setViewMonth(m);
  }

  const cells = useMemo(() => {
    const first     = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMon = new Date(viewYear, viewMonth + 1, 0).getDate();
    const arr: (number | null)[] = Array(first).fill(null);
    for (let d = 1; d <= daysInMon; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [viewYear, viewMonth]);

  function isDisabled(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    return d < minDate;
  }
  function isSelected(day: number) {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === viewYear &&
           selectedDate.getMonth()    === viewMonth &&
           selectedDate.getDate()     === day;
  }
  function isToday(day: number) {
    return today.getFullYear() === viewYear &&
           today.getMonth()    === viewMonth &&
           today.getDate()     === day;
  }

  return (
    <View style={cal.wrap}>
      {/* Nav */}
      <View style={cal.navRow}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <Ionicons name="chevron-back" size={18} color="#1D4ED8" />
        </TouchableOpacity>
        <Text style={cal.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <Ionicons name="chevron-forward" size={18} color="#1D4ED8" />
        </TouchableOpacity>
      </View>
      {/* Day headers */}
      <View style={cal.daysRow}>
        {DAYS.map(d => <Text key={d} style={cal.dayHead}>{d}</Text>)}
      </View>
      {/* Cells */}
      <View style={cal.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={cal.cell} />;
          const disabled = isDisabled(day);
          const selected = isSelected(day);
          const tday     = isToday(day);
          return (
            <TouchableOpacity
              key={`d-${idx}`}
              style={[cal.cell, selected && cal.cellSelected, tday && !selected && cal.cellToday, disabled && cal.cellDisabled]}
              onPress={() => { if (!disabled) onSelect(new Date(viewYear, viewMonth, day)); }}
              disabled={disabled}
            >
              <Text style={[cal.cellTxt, selected && cal.cellTxtSel, disabled && cal.cellTxtDis]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function showAlert(title: string, message?: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

async function sendNotification(userId: number, role: "tenant" | "owner", type: string, title: string, message: string, relatedId: number, actionType?: string) {
  try {
    await fetch(API_ENDPOINTS.NOTIFICATIONS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", user_id: userId, user_role: role, type, title, message, related_id: relatedId, action_type: actionType }),
    });
  } catch { /* non-critical */ }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const router = useRouter();
  const { id: propertyId } = useLocalSearchParams<{ id: string }>();

  const [property,    setProperty]    = useState<any>(null);
  const [loadingProp, setLoadingProp] = useState(true);
  const [submitting,  setSubmitting]  = useState(false);

  // Form fields
  const [fullName,        setFullName]        = useState("");
  const [email,           setEmail]           = useState("");
  const [phone,           setPhone]           = useState("");
  const [currentAddress,  setCurrentAddress]  = useState("");
  const [idType,          setIdType]          = useState("");
  const [showIdTypeMenu,  setShowIdTypeMenu]  = useState(false);
  const [idNumber,        setIdNumber]        = useState("");
  const [idImage,         setIdImage]         = useState<any>(null);
  const [emergencyName,   setEmergencyName]   = useState("");
  const [emergencyPhone,  setEmergencyPhone]  = useState("");
  const [occupants,       setOccupants]       = useState("1");
  const [specialRequest,  setSpecialRequest]  = useState("");

  // Calendar state
  const [moveInDate,   setMoveInDate]   = useState<Date | null>(null);
  const [calVisible,   setCalVisible]   = useState(false);
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const moveInStr = moveInDate ? moveInDate.toISOString().slice(0, 10) : "";

  // Lease duration — set dynamically based on property type
  const [leaseDuration, setLeaseDuration] = useState("12 Months");
  const [transientDays, setTransientDays] = useState("");

  // Pre-fill from stored user
  useEffect(() => {
    UserStorage.getUser("tenant").then((u) => {
      if (u) { setFullName(u.fullname); setEmail(u.email); }
    });
  }, []);

  // Load property details
  useEffect(() => {
    if (!propertyId) return;
    fetch(`${API_ENDPOINTS.GET_PROPERTIES}?property_id=${propertyId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") {
          setProperty(d.data);
          // Set default lease duration based on property type
          const pt = (d.data.property_type ?? "").toLowerCase();
          if (pt === "condominium" || pt === "apartment") {
            setLeaseDuration("6 Months");
          } else if (pt === "transient") {
            setLeaseDuration("12 Hours");
          } else if (pt === "dormitory") {
            setLeaseDuration("3 Months");
          } else if (d.data.lease_duration) {
            setLeaseDuration(d.data.lease_duration);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProp(false));
  }, [propertyId]);

  async function pickIdImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { showAlert("Permission needed", "Allow photo access to upload your ID."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images" as any, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setIdImage(result.assets[0]);
  }

  function validate(): boolean {
    if (!fullName.trim())       { showAlert("Missing", "Full name is required.");         return false; }
    if (!email.trim())          { showAlert("Missing", "Email is required.");              return false; }
    if (!phone.trim())          { showAlert("Missing", "Phone number is required.");       return false; }
    if (!currentAddress.trim()) { showAlert("Missing", "Current address is required.");   return false; }
    if (!idType)                { showAlert("Missing", "Please select an ID type.");       return false; }
    if (!idNumber.trim())       { showAlert("Missing", "ID number is required.");          return false; }
    if (!moveInDate)            { showAlert("Missing", "Please select a move-in date.");  return false; }
    return true;
  }

  async function submitBooking() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await UserStorage.getUser("tenant");
      if (!user) { showAlert("Error", "Please log in first."); setSubmitting(false); return; }

      const form = new FormData();
      form.append("tenant_id",              String(user.user_id));
      form.append("property_id",            String(propertyId));
      form.append("full_name",              fullName);
      form.append("email",                  email);
      form.append("phone",                  phone);
      form.append("current_address",        currentAddress);
      form.append("id_type",                idType);
      form.append("id_number",              idNumber);
      form.append("emergency_contact_name", emergencyName);
      form.append("emergency_contact_phone",emergencyPhone);
      form.append("move_in",                moveInStr);
      form.append("lease_duration",         leaseDuration);
      form.append("duration",               leaseDuration.split(" ")[0]);
      form.append("occupants",              occupants);
      form.append("special_request",        specialRequest);

      if (idImage) {
        const uri  = idImage.uri;
        const name = idImage.fileName || `id_${Date.now()}.jpg`;
        const type = idImage.mimeType || "image/jpeg";
        (form as any).append("id_image", { uri, name, type });
      }

      const res  = await fetch(API_ENDPOINTS.BOOK_ROOM, { method: "POST", body: form });
      const data = await res.json();

      if (data.status === "success") {
        const bookingId = data.booking_id ?? 0;
        const propName  = property?.name ?? "the property";

        // Notify the tenant that booking was submitted
        await sendNotification(
          Number(user.user_id), "tenant", "booking",
          "Booking Request Submitted!",
          `Your booking request for "${propName}" has been submitted and is pending owner approval. Move-in: ${moveInStr}`,
          bookingId, "approval",
        );

        // Notify the owner about a new booking request (if we have owner_id)
        if (property?.owner_id) {
          await sendNotification(
            Number(property.owner_id), "owner", "booking",
            "New Booking Request!",
            `${fullName} has submitted a booking request for "${propName}". Move-in: ${moveInStr}. Please review and respond.`,
            bookingId, "approval",
          );
        }

        router.replace("/tenant/pending-approval");
      } else {
        showAlert("Booking Failed", data.message || "Please try again.");
      }
    } catch (err) {
      showAlert("Connection Error", "Cannot reach the server. Make sure XAMPP is running.");
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
      {/* Calendar Modal */}
      <Modal visible={calVisible} transparent animationType="fade" onRequestClose={() => setCalVisible(false)}>
        <View style={styles.calModalOverlay}>
          <View style={styles.calModalBox}>
            <View style={styles.calModalHeader}>
              <Text style={styles.calModalTitle}>Select Move-in Date</Text>
              <TouchableOpacity onPress={() => setCalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <CalendarPicker selectedDate={moveInDate} minDate={today} onSelect={(d) => { setMoveInDate(d); setCalVisible(false); }} />
            {moveInDate && (
              <TouchableOpacity style={styles.calClearBtn} onPress={() => setMoveInDate(null)}>
                <Text style={styles.calClearTxt}>Clear Selection</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
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
              {property.lease_duration && (
                <Text style={styles.propLease}>Min. Lease: {property.lease_duration}</Text>
              )}
            </View>
            <Text style={styles.propPrice}>₱{Number(property.price).toLocaleString()}/mo</Text>
          </View>
        )}

        {/* ── Personal Info ─────────────────────────── */}
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Juan Dela Cruz" placeholderTextColor="#9CA3AF" />

        <Text style={styles.label}>Email Address *</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="juan@example.com" placeholderTextColor="#9CA3AF" />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="09XX XXX XXXX" placeholderTextColor="#9CA3AF" />

        <Text style={styles.label}>Current Address *</Text>
        <TextInput style={[styles.input, styles.textArea]} value={currentAddress} onChangeText={setCurrentAddress} multiline placeholder="House / Unit No., Street, Barangay, City" placeholderTextColor="#9CA3AF" />

        {/* ── ID Verification ───────────────────────── */}
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
        <TextInput style={styles.input} value={idNumber} onChangeText={setIdNumber} placeholder="Enter your ID number" placeholderTextColor="#9CA3AF" />

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

        {/* ── Emergency Contact ─────────────────────── */}
        <Text style={styles.sectionTitle}>Emergency Contact</Text>

        <Text style={styles.label}>Contact Name</Text>
        <TextInput style={styles.input} value={emergencyName} onChangeText={setEmergencyName} placeholder="Maria Dela Cruz" placeholderTextColor="#9CA3AF" />

        <Text style={styles.label}>Contact Phone</Text>
        <TextInput style={styles.input} value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" placeholder="09XX XXX XXXX" placeholderTextColor="#9CA3AF" />

        {/* ── Lease Details ─────────────────────────── */}
        <Text style={styles.sectionTitle}>Lease Details</Text>

        {/* Calendar Date Picker */}
        <Text style={styles.label}>Move-in Date *</Text>
        <TouchableOpacity style={styles.calBtn} onPress={() => setCalVisible(true)}>
          <Ionicons name="calendar" size={20} color={moveInDate ? "#1D4ED8" : "#94A3B8"} />
          <Text style={[styles.calBtnTxt, !moveInDate && styles.placeholder]}>
            {moveInDate
              ? `${DAYS[moveInDate.getDay()]}, ${MONTHS[moveInDate.getMonth()]} ${moveInDate.getDate()}, ${moveInDate.getFullYear()}`
              : "Tap to select move-in date"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#94A3B8" />
        </TouchableOpacity>
        {moveInDate && (
          <View style={styles.calSelectedBox}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.calSelectedTxt}>Move-in: {moveInStr}</Text>
          </View>
        )}

        <Text style={styles.label}>Lease Duration *</Text>
        {(property?.property_type === "Condominium" || property?.property_type === "Apartment") ? (
          <View style={styles.leaseChoiceRow}>
            {["6 Months", "12 Months"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.leaseChoiceBtn, leaseDuration === opt && styles.leaseChoiceBtnActive]}
                onPress={() => setLeaseDuration(opt)}
              >
                <Text style={[styles.leaseChoiceTxt, leaseDuration === opt && styles.leaseChoiceTxtActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : property?.property_type === "Transient" ? (
          <View>
            <View style={styles.leaseChoiceRow}>
              <TouchableOpacity
                style={[styles.leaseChoiceBtn, styles.leaseChoiceBtnActive, { flex: 1 }]}
                onPress={() => { setTransientDays(""); setLeaseDuration("12 Hours"); }}
              >
                <Text style={[styles.leaseChoiceTxt, styles.leaseChoiceTxtActive]}>
                  {transientDays && transientDays !== "0" ? `${transientDays} Day${parseInt(transientDays) > 1 ? "s" : ""}` : "12 Hours (Default)"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.label, { marginTop: 10 }]}>Custom number of days (optional):</Text>
            <TextInput
              style={styles.input}
              value={transientDays}
              onChangeText={(t) => {
                const n = t.replace(/[^0-9]/g, "");
                setTransientDays(n);
                if (n && n !== "0") setLeaseDuration(`${n} Day${parseInt(n) > 1 ? "s" : ""}`);
                else setLeaseDuration("12 Hours");
              }}
              keyboardType="number-pad"
              placeholder="Leave blank for 12 hours, or enter number of days"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        ) : property?.property_type === "Dormitory" ? (
          <View style={styles.leaseChoiceRow}>
            {["3 Months", "6 Months", "12 Months"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.leaseChoiceBtn, leaseDuration === opt && styles.leaseChoiceBtnActive]}
                onPress={() => setLeaseDuration(opt)}
              >
                <Text style={[styles.leaseChoiceTxt, leaseDuration === opt && styles.leaseChoiceTxtActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.leaseBadge}>
            <Ionicons name="time-outline" size={16} color="#1D4ED8" />
            <Text style={styles.leaseBadgeTxt}>{leaseDuration}</Text>
            <Text style={styles.leaseNote}>(set by property owner)</Text>
          </View>
        )}

        <Text style={styles.label}>Number of Occupants</Text>
        <TextInput style={styles.input} value={occupants} onChangeText={setOccupants} keyboardType="number-pad" placeholder="1" placeholderTextColor="#9CA3AF" />

        <Text style={styles.label}>Special Requests / Notes</Text>
        <TextInput style={[styles.input, styles.textArea]} value={specialRequest} onChangeText={setSpecialRequest} multiline placeholder="Pets, parking needs, etc." placeholderTextColor="#9CA3AF" />

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
          Your booking is pending until the owner reviews and approves it. You will be notified at each step.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center:           { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
  loadingText:      { marginTop: 12, color: "#64748B" },
  header:           { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, paddingTop: 18, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 8 },
  headerTitle:      { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  headerSub:        { fontSize: 12, color: "#64748B", marginTop: 1 },
  content:          { padding: 16, paddingBottom: 40 },
  propCard:         { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#EFF6FF", borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: "#BFDBFE" },
  propName:         { fontSize: 14, fontWeight: "700", color: "#1E3A8A" },
  propAddress:      { fontSize: 12, color: "#3B82F6", marginTop: 2 },
  propLease:        { fontSize: 11, color: "#6B7280", marginTop: 2 },
  propPrice:        { fontSize: 14, fontWeight: "800", color: "#1D4ED8" },
  sectionTitle:     { fontSize: 15, fontWeight: "700", color: "#1D4ED8", marginTop: 20, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  label:            { fontSize: 13, fontWeight: "600", color: "#374151", marginTop: 10, marginBottom: 4 },
  input:            { backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#1E293B" },
  textArea:         { minHeight: 80, textAlignVertical: "top" },
  dropdownBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14, paddingVertical: 11 },
  dropdownBtnText:  { fontSize: 14, color: "#1E293B" },
  placeholder:      { color: "#94A3B8" },
  dropdownMenu:     { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", marginTop: 4, marginBottom: 8, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  dropdownItem:     { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  dropdownItemText: { fontSize: 14, color: "#374151" },
  dropdownItemActive:{ color: "#1D4ED8", fontWeight: "700" },
  uploadBox:        { borderWidth: 1.5, borderColor: "#CBD5E1", borderStyle: "dashed", borderRadius: 12, padding: 16, alignItems: "center", gap: 6, marginTop: 4 },
  uploadBoxDone:    { borderColor: "#059669", backgroundColor: "#F0FDF4" },
  uploadPreviewRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  uploadPreview:    { width: 60, height: 60, borderRadius: 8, backgroundColor: "#E2E8F0" },
  uploadDoneText:   { fontSize: 14, fontWeight: "700", color: "#059669" },
  uploadChangeText: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  uploadText:       { fontSize: 14, color: "#64748B" },
  uploadHint:       { fontSize: 12, color: "#94A3B8" },
  // Calendar trigger button
  calBtn:           { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14, paddingVertical: 13 },
  calBtnTxt:        { flex: 1, fontSize: 14, color: "#1E293B" },
  calSelectedBox:   { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F0FDF4", borderRadius: 8, padding: 10, marginTop: 6, borderWidth: 1, borderColor: "#BBF7D0" },
  calSelectedTxt:   { fontSize: 13, color: "#059669", fontWeight: "600" },
  // Calendar modal
  calModalOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 16 },
  calModalBox:      { backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 380, padding: 16, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  calModalHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  calModalTitle:    { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  calClearBtn:      { marginTop: 12, alignItems: "center" },
  calClearTxt:      { color: "#DC2626", fontSize: 13, fontWeight: "600" },
  // Lease badge
  leaseBadge:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EFF6FF", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  leaseBadgeTxt:    { fontSize: 14, fontWeight: "700", color: "#1D4ED8" },
  leaseNote:        { fontSize: 12, color: "#64748B", fontStyle: "italic" },
  leaseChoiceRow:   { flexDirection: "row", gap: 10, marginTop: 4, flexWrap: "wrap" },
  leaseChoiceBtn:   { flex: 1, minWidth: 90, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC", alignItems: "center" },
  leaseChoiceBtnActive: { borderColor: "#1D4ED8", backgroundColor: "#EFF6FF" },
  leaseChoiceTxt:   { fontSize: 14, fontWeight: "600", color: "#64748B" },
  leaseChoiceTxtActive: { color: "#1D4ED8" },
  // Submit
  submitBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1D4ED8", paddingVertical: 15, borderRadius: 14, marginTop: 28 },
  submitBtnDisabled:{ opacity: 0.6 },
  submitBtnText:    { color: "#fff", fontSize: 16, fontWeight: "700" },
  disclaimer:       { textAlign: "center", fontSize: 12, color: "#94A3B8", marginTop: 14, lineHeight: 18 },
});

// ─── Calendar styles ──────────────────────────────────────────────────────────
const cal = StyleSheet.create({
  wrap:        { paddingTop: 4 },
  navRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navBtn:      { padding: 8, backgroundColor: "#EFF6FF", borderRadius: 8 },
  monthLabel:  { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  daysRow:     { flexDirection: "row", marginBottom: 4 },
  dayHead:     { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: "#94A3B8", paddingVertical: 4 },
  grid:        { flexDirection: "row", flexWrap: "wrap" },
  cell:        { width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  cellSelected:{ backgroundColor: "#1D4ED8", borderRadius: 8 },
  cellToday:   { backgroundColor: "#EFF6FF", borderRadius: 8 },
  cellDisabled:{ opacity: 0.3 },
  cellTxt:     { fontSize: 14, color: "#1E293B", fontWeight: "500" },
  cellTxtSel:  { color: "#fff", fontWeight: "700" },
  cellTxtDis:  { color: "#CBD5E1" },
});

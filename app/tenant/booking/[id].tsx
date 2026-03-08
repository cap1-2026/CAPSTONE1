import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import API_ENDPOINTS from "../../../config/api";
import { UserStorage } from "../../../utils/userStorage";

export default function BookingPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [moveInDate, setMoveInDate] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [leaseDuration, setLeaseDuration] = useState("");
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  
  // Personal Information
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [validId, setValidId] = useState("");
  const [idImage, setIdImage] = useState<string | null>(null);
  const [idType, setIdType] = useState("");

  // Mock property data - in real app, fetch based on id
  const property = {
    id: id,
    name: "Sunshine Apartments Unit 3A",
    address: "123 Main St, Makati City",
    price: 15000,
    image: "https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Property+Image"
  };

  const durationOptions = ["6 months", "12 months", "24 months"];

  const securityDeposit = property.price;
  const totalDue = property.price + securityDeposit;

  // Load user session
  useEffect(() => {
    async function loadUser() {
      const user = await UserStorage.getUser();
      if (user) {
        setUserId(user.user_id);
        // Pre-fill user info if available
        setFullName(user.fullname);
        setEmail(user.email);
      } else {
        Alert.alert("Session Expired", "Please login again", [
          { text: "OK", onPress: () => router.replace("/login/tenant") }
        ]);
      }
    }
    loadUser();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to scan ID');
      return false;
    }
    return true;
  };

  const handleScanId = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIdImage(result.assets[0].uri);
      Alert.alert('Success', 'ID captured successfully! Please also enter your ID details below.');
    }
  };

  const handleUploadId = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIdImage(result.assets[0].uri);
      Alert.alert('Success', 'ID uploaded successfully! Please also enter your ID details below.');
    }
  };

  const handleSubmitBooking = async () => {
    // Validate required fields only
    if (!fullName || !phone || !moveInDate || !leaseDuration) {
      Alert.alert("Incomplete Information", "Please fill in your name, phone, move-in date, and lease duration.");
      return;
    }

    if (!userId) {
      Alert.alert("Session Expired", "Please login again.", [
        { text: "OK", onPress: () => router.replace("/login/tenant") }
      ]);
      return;
    }

    setIsSubmitting(true);

    try {
      const durationMonths = parseInt(leaseDuration.split(" ")[0]);
      const propertyId = Array.isArray(id) ? id[0] : id;
      const formData = new FormData();
      formData.append("tenant_id", String(userId));
      formData.append("property_id", String(parseInt(propertyId)));
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("current_address", currentAddress);
      formData.append("id_type", idType);
      formData.append("id_number", validId);
      formData.append("emergency_contact_name", emergencyContactName);
      formData.append("emergency_contact_phone", emergencyContactPhone);
      formData.append("move_in", moveInDate);
      formData.append("lease_duration", leaseDuration);
      formData.append("duration", String(durationMonths));
      formData.append("occupants", "1");

      if (idImage) {
        formData.append("id_image", {
          uri: idImage,
          name: "id_image.jpg",
          type: "image/jpeg"
        } as any);
      }

      const response = await fetch(API_ENDPOINTS.BOOK_ROOM, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      });

      const data = await response.json();

      if (data.status !== "success") {
        Alert.alert("Booking Failed", data.message || "Please try again.");
        setIsSubmitting(false);
        return;
      }

      Alert.alert(
        "Booking Submitted!",
        "Your booking request has been submitted successfully. The property owner will review your application."
      );
      router.replace("/tenant/pending-approval");
    } catch (error) {
      Alert.alert("Connection Error", "Could not reach the server. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <ScrollView 
      style={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color="#007AFF" />
        <Text style={styles.backText}>Back to Property</Text>
      </TouchableOpacity>

      {/* Page Title */}
      <Text style={styles.pageTitle}>Complete Your Booking</Text>

      <View style={styles.content}>
        {/* Personal Information */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <Text style={styles.cardSubtitle}>Please provide your accurate information for the lease agreement</Text>

          {/* Full Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Email Address <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+63 912 345 6789"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Current Address */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Current Address <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Street, City, Province"
                value={currentAddress}
                onChangeText={setCurrentAddress}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Valid ID Verification */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Valid ID Verification <Text style={styles.required}>*</Text>
            </Text>
            
            {/* ID Scanning Options */}
            {!idImage ? (
              <View style={styles.idScanContainer}>
                <View style={styles.idScanHeader}>
                  <Ionicons name="shield-checkmark" size={40} color="#007AFF" />
                  <Text style={styles.idScanTitle}>Verify Your Identity</Text>
                  <Text style={styles.idScanSubtitle}>Scan or upload your valid government-issued ID</Text>
                </View>

                <View style={styles.scanButtonsRow}>
                  <TouchableOpacity style={styles.scanButton} onPress={handleScanId}>
                    <Ionicons name="camera" size={32} color="#007AFF" />
                    <Text style={styles.scanButtonText}>Scan ID</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.scanButton} onPress={handleUploadId}>
                    <Ionicons name="images" size={32} color="#007AFF" />
                    <Text style={styles.scanButtonText}>Upload Photo</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.acceptedIdsBox}>
                  <Text style={styles.acceptedIdsTitle}>Accepted IDs:</Text>
                  <Text style={styles.acceptedIdText}>• Driver's License</Text>
                  <Text style={styles.acceptedIdText}>• Passport</Text>
                  <Text style={styles.acceptedIdText}>• National ID / UMID</Text>
                  <Text style={styles.acceptedIdText}>• SSS / Philhealth / TIN</Text>
                  <Text style={styles.acceptedIdText}>• Voter's ID</Text>
                </View>
              </View>
            ) : (
              <View style={styles.idPreviewContainer}>
                <View style={styles.idPreviewHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <Text style={styles.idVerifiedText}>ID Captured</Text>
                </View>
                <Image source={{ uri: idImage }} style={styles.idPreviewImage} />
                <TouchableOpacity style={styles.retakeButton} onPress={() => {
                  setIdImage(null);
                  setValidId("");
                  setIdType("");
                }}>
                  <Ionicons name="refresh" size={20} color="#007AFF" />
                  <Text style={styles.retakeButtonText}>Retake Photo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ID Type and Number */}
            {idImage && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    ID Type <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Driver's License, Passport"
                      value={idType}
                      onChangeText={setIdType}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    ID Number <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter ID number"
                      value={validId}
                      onChangeText={setValidId}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Emergency Contact Section */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Emergency Contact</Text>

          {/* Emergency Contact Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Contact Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Emergency contact full name"
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Emergency Contact Phone */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Contact Phone <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+63 912 345 6789"
                value={emergencyContactPhone}
                onChangeText={setEmergencyContactPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          {/* Move-in Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Move-in Date <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowCalendar(!showCalendar)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
              <Text style={[styles.datePickerText, !moveInDate && { color: "#999" }]}>
                {moveInDate || "Select move-in date"}
              </Text>
              <Ionicons name={showCalendar ? "chevron-up" : "chevron-down"} size={18} color="#666" />
            </TouchableOpacity>

            {showCalendar && (() => {
              const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
              const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];
              const today = new Date(); today.setHours(0,0,0,0);
              const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
              const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
              const cells: (number | null)[] = [
                ...Array(firstDayOfMonth).fill(null),
                ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
              ];
              // pad to complete last row
              while (cells.length % 7 !== 0) cells.push(null);
              const rows: (number | null)[][] = [];
              for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

              const prevMonth = () => {
                if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
                else setCalendarMonth(m => m - 1);
              };
              const nextMonth = () => {
                if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
                else setCalendarMonth(m => m + 1);
              };
              const selectDay = (day: number) => {
                const picked = new Date(calendarYear, calendarMonth, day);
                if (picked < today) return;
                const mm = String(calendarMonth + 1).padStart(2, "0");
                const dd = String(day).padStart(2, "0");
                setMoveInDate(`${mm}/${dd}/${calendarYear}`);
                setShowCalendar(false);
              };

              return (
                <View style={styles.calendar}>
                  {/* Month / Year nav */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={prevMonth} style={styles.calendarNavBtn}>
                      <Ionicons name="chevron-back" size={20} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.calendarTitle}>{MONTH_NAMES[calendarMonth]} {calendarYear}</Text>
                    <TouchableOpacity onPress={nextMonth} style={styles.calendarNavBtn}>
                      <Ionicons name="chevron-forward" size={20} color="#333" />
                    </TouchableOpacity>
                  </View>

                  {/* Day headers */}
                  <View style={styles.calendarRow}>
                    {DAY_NAMES.map(d => (
                      <Text key={d} style={styles.calendarDayName}>{d}</Text>
                    ))}
                  </View>

                  {/* Day cells */}
                  {rows.map((row, ri) => (
                    <View key={ri} style={styles.calendarRow}>
                      {row.map((day, di) => {
                        if (!day) return <View key={di} style={styles.calendarCell} />;
                        const picked = new Date(calendarYear, calendarMonth, day);
                        const isPast = picked < today;
                        const mm = String(calendarMonth + 1).padStart(2, "0");
                        const dd = String(day).padStart(2, "0");
                        const isSelected = moveInDate === `${mm}/${dd}/${calendarYear}`;
                        return (
                          <TouchableOpacity
                            key={di}
                            style={[styles.calendarCell, isSelected && styles.calendarCellSelected, isPast && styles.calendarCellPast]}
                            onPress={() => selectDay(day)}
                            disabled={isPast}
                          >
                            <Text style={[styles.calendarCellText, isSelected && styles.calendarCellTextSelected, isPast && styles.calendarCellTextPast]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>

          {/* Lease Duration */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Lease Duration <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowDurationDropdown(!showDurationDropdown)}
            >
              <Text style={[styles.dropdownText, !leaseDuration && styles.placeholderText]}>
                {leaseDuration || "Select duration"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            {showDurationDropdown && (
              <View style={styles.dropdownOptions}>
                {durationOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setLeaseDuration(option);
                      setShowDurationDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Important Information */}
          <View style={styles.infoBox}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color="#1976D2" />
              <Text style={styles.infoTitle}>Important Information:</Text>
            </View>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>
                • Your request will be sent to the owner for review
              </Text>
              <Text style={styles.infoItem}>
                • Owner typically responds within 24-48 hours
              </Text>
              <Text style={styles.infoItem}>
                • You'll be notified once your request is approved
              </Text>
              <Text style={styles.infoItem}>
                • Payment will be required after approval
              </Text>
              <Text style={styles.infoItem}>
                • Digital contract will be sent after payment confirmation
              </Text>
              <Text style={styles.infoItem}>
                • IoT key access will be provided after contract signing
              </Text>
            </View>
          </View>

          {/* Submit Booking Button */}
          <TouchableOpacity
            style={[styles.paymentButton, isSubmitting && styles.paymentButtonDisabled]}
            onPress={() => {
              console.log("🔵 SUBMIT BOOKING BUTTON CLICKED!");
              handleSubmitBooking();
            }}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={styles.paymentButtonText}>
              {isSubmitting ? "Submitting..." : "Submit Booking Request"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Booking Summary</Text>

          {/* Property Image */}
          <View style={styles.propertyImage}>
            <Text style={styles.imagePlaceholder}>🏠</Text>
          </View>

          {/* Property Info */}
          <Text style={styles.propertyName}>{property.name}</Text>
          <Text style={styles.propertyAddress}>{property.address}</Text>

          {/* Pricing Breakdown */}
          <View style={styles.pricingBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>First Month Rent:</Text>
              <Text style={styles.priceValue}>₱{property.price.toLocaleString()}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Security Deposit:</Text>
              <Text style={styles.priceValue}>₱{securityDeposit.toLocaleString()}</Text>
            </View>
          </View>

          {/* Total Due */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Estimated Total (After Approval):</Text>
            <Text style={styles.totalAmount}>₱{totalDue.toLocaleString()}</Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefits}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>Owner reviews your application</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>Secure payment after approval</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>Deposit held in escrow</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  backButton: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#fff", gap: 8 },
  backText: { fontSize: 16, color: "#007AFF", fontWeight: "500" },
  pageTitle: { fontSize: 28, fontWeight: "700", color: "#333", paddingHorizontal: 16, paddingVertical: 20 },
  content: { padding: 16, gap: 16 },
  
  // Cards
  detailsCard: { backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 16 },
  summaryCard: { backgroundColor: "#fff", padding: 20, borderRadius: 12 },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 20 },
  cardSubtitle: { fontSize: 14, color: "#666", marginBottom: 20, marginTop: -12 },
  
  // Form Elements
  formGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 8 },
  required: { color: "#F44336" },
  helperText: { fontSize: 12, color: "#999", marginTop: 4, marginLeft: 4 },
  sectionDivider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 16 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8f8f8", borderRadius: 8, borderWidth: 1, borderColor: "#e0e0e0", paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 15, color: "#333" },
  datePickerText: { flex: 1, fontSize: 15, color: "#333", paddingVertical: 14 },
  
  // Dropdown
  dropdown: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8f8f8", borderRadius: 8, borderWidth: 1, borderColor: "#e0e0e0", paddingHorizontal: 12, height: 48 },
  dropdownText: { fontSize: 15, color: "#333" },
  placeholderText: { color: "#999" },
  dropdownOptions: { marginTop: 8, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#e0e0e0", overflow: "hidden" },
  dropdownOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  dropdownOptionText: { fontSize: 15, color: "#333" },
  
  // Info Box
  infoBox: { backgroundColor: "#E3F2FD", padding: 16, borderRadius: 8, marginBottom: 20 },
  infoHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  infoTitle: { fontSize: 15, fontWeight: "600", color: "#1976D2" },
  infoList: { gap: 8 },
  infoItem: { fontSize: 14, color: "#1565C0", lineHeight: 20 },
  
  // Payment Button
  paymentButton: { backgroundColor: "#2962FF", paddingVertical: 16, borderRadius: 8, alignItems: "center" },
  paymentButtonDisabled: { backgroundColor: "#90A4AE" },
  paymentButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  
  // Property Summary
  propertyImage: { width: "100%", height: 200, backgroundColor: "#e0e0e0", borderRadius: 8, marginBottom: 16, justifyContent: "center", alignItems: "center" },
  imagePlaceholder: { fontSize: 60 },
  propertyName: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 4 },
  propertyAddress: { fontSize: 14, color: "#666", marginBottom: 20 },
  
  // Pricing
  pricingBreakdown: { borderTopWidth: 1, borderTopColor: "#f0f0f0", paddingTop: 16, gap: 12, marginBottom: 16 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLabel: { fontSize: 15, color: "#666" },
  priceValue: { fontSize: 15, fontWeight: "600", color: "#333" },
  
  // Total
  totalSection: { backgroundColor: "#f8f8f8", padding: 16, borderRadius: 8, marginBottom: 20 },
  totalLabel: { fontSize: 16, color: "#666", marginBottom: 4 },
  totalAmount: { fontSize: 32, fontWeight: "700", color: "#2962FF" },
  
  // Benefits
  benefits: { gap: 12 },
  benefitItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  benefitText: { fontSize: 14, color: "#666" },
  
  // ID Scanning
  idScanContainer: { backgroundColor: "#F5F9FF", borderRadius: 12, padding: 20, borderWidth: 2, borderColor: "#E3F2FD", marginTop: 8 },
  idScanHeader: { alignItems: "center", marginBottom: 20 },
  idScanTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginTop: 12, marginBottom: 4 },
  idScanSubtitle: { fontSize: 13, color: "#666", textAlign: "center" },
  scanButtonsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  scanButton: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 2, borderColor: "#007AFF", gap: 8 },
  scanButtonText: { fontSize: 14, fontWeight: "600", color: "#007AFF" },
  acceptedIdsBox: { backgroundColor: "#fff", borderRadius: 8, padding: 16, borderWidth: 1, borderColor: "#e0e0e0" },
  acceptedIdsTitle: { fontSize: 14, fontWeight: "700", color: "#333", marginBottom: 8 },
  acceptedIdText: { fontSize: 13, color: "#666", lineHeight: 22 },
  idPreviewContainer: { backgroundColor: "#F0F9FF", borderRadius: 12, padding: 16, marginTop: 8, borderWidth: 2, borderColor: "#4CAF50" },
  idPreviewHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  idVerifiedText: { fontSize: 16, fontWeight: "700", color: "#4CAF50" },
  idPreviewImage: { width: "100%", height: 200, borderRadius: 8, backgroundColor: "#e0e0e0", marginBottom: 12 },
  retakeButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#fff", paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#007AFF" },
  retakeButtonText: { fontSize: 14, fontWeight: "600", color: "#007AFF" },

  // Calendar
  calendar: { marginTop: 8, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e0e0e0", padding: 12 },
  calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  calendarNavBtn: { padding: 6 },
  calendarTitle: { fontSize: 15, fontWeight: "700", color: "#333" },
  calendarRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 4 },
  calendarDayName: { width: 36, textAlign: "center", fontSize: 12, fontWeight: "600", color: "#888" },
  calendarCell: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  calendarCellSelected: { backgroundColor: "#2962FF" },
  calendarCellPast: { opacity: 0.3 },
  calendarCellText: { fontSize: 14, color: "#333" },
  calendarCellTextSelected: { color: "#fff", fontWeight: "700" },
  calendarCellTextPast: { color: "#999" },
});

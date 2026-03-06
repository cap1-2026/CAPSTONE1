import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function BookingPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [moveInDate, setMoveInDate] = useState("");
  const [leaseDuration, setLeaseDuration] = useState("");
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);

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

  const handleSubmitBooking = () => {
    // Validate fields
    if (!moveInDate || !leaseDuration) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }
    
    // In real app, submit booking to backend
    console.log("Booking submitted...");
    
    // Show success message and redirect
    Alert.alert(
      "Booking Request Submitted! ✓",
      "Your booking request has been submitted successfully. The property owner will review your application within 2-3 business days. You'll receive a notification once it's approved.",
      [
        {
          text: "View My Requests",
          onPress: () => router.push("/tenant/approvals")
        },
        {
          text: "OK",
          style: "cancel"
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
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
        {/* Booking Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          {/* Move-in Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Move-in Date <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="mm/dd/yyyy"
                value={moveInDate}
                onChangeText={setMoveInDate}
                placeholderTextColor="#999"
              />
            </View>
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
              <Text style={styles.infoTitle}>How Booking Works:</Text>
            </View>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>
                1. Submit your booking request with move-in date and lease duration
              </Text>
              <Text style={styles.infoItem}>
                2. Property owner will review and approve your request (2-3 days)
              </Text>
              <Text style={styles.infoItem}>
                3. Once approved, you'll receive a notification to proceed with payment
              </Text>
              <Text style={styles.infoItem}>
                4. After payment, digital contract will be sent for e-signature
              </Text>
              <Text style={styles.infoItem}>
                5. IoT key access will be activated after contract signing
              </Text>
            </View>
          </View>

          {/* Submit Booking Button */}
          <TouchableOpacity style={styles.paymentButton} onPress={handleSubmitBooking}>
            <Text style={styles.paymentButtonText}>Submit Booking Request</Text>
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
            <Text style={styles.totalLabel}>Total Due After Approval:</Text>
            <Text style={styles.totalAmount}>₱{totalDue.toLocaleString()}</Text>
            <Text style={styles.totalNote}>Payment required only after owner approval</Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefits}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>No payment required now</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>Owner reviews within 2-3 days</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>Get notification when approved</Text>
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
  
  // Form Elements
  formGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 8 },
  required: { color: "#F44336" },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8f8f8", borderRadius: 8, borderWidth: 1, borderColor: "#e0e0e0", paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 15, color: "#333" },
  
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
  totalNote: { fontSize: 12, color: "#999", marginTop: 4 },
  
  // Benefits
  benefits: { gap: 12 },
  benefitItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  benefitText: { fontSize: 14, color: "#666" },
});

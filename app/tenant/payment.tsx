import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "card" | "bank" | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock booking data - in real app, fetch based on booking ID
  const booking = {
    propertyName: "Sunshine Apartments Unit 3A",
    propertyAddress: "123 Main St, Makati City",
    monthlyRent: 15000,
    securityDeposit: 15000,
    moveInDate: "04/01/2026",
    leaseDuration: "12 months",
  };

  const totalAmount = booking.monthlyRent + booking.securityDeposit;

  const handlePayment = () => {
    if (!paymentMethod) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }

    if (paymentMethod === "card" && (!cardNumber || !cardName || !expiryDate || !cvv)) {
      Alert.alert("Error", "Please fill in all card details");
      return;
    }

    if (paymentMethod === "gcash" && !gcashNumber) {
      Alert.alert("Error", "Please enter your GCash number");
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        "Payment Successful! 🎉",
        "Your payment has been processed. You will receive a confirmation email shortly.",
        [
          {
            text: "OK",
            onPress: () => router.push("/tenant/home")
          }
        ]
      );
    }, 2000);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Payment</Text>
          <Text style={styles.headerSubtitle}>Complete your booking payment</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Booking Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          
          <View style={styles.propertyInfo}>
            <View style={styles.propertyIcon}>
              <Ionicons name="home" size={32} color="#4CAF50" />
            </View>
            <View style={styles.propertyDetails}>
              <Text style={styles.propertyName}>{booking.propertyName}</Text>
              <Text style={styles.propertyAddress}>
                <Ionicons name="location" size={14} color="#666" /> {booking.propertyAddress}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailLabel}>Move-in:</Text>
              <Text style={styles.detailValue}>{booking.moveInDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{booking.leaseDuration}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Price Breakdown */}
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>First Month Rent</Text>
              <Text style={styles.priceValue}>₱{booking.monthlyRent.toLocaleString()}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Security Deposit</Text>
              <Text style={styles.priceValue}>₱{booking.securityDeposit.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₱{totalAmount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          {/* GCash */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              paymentMethod === "gcash" && styles.paymentMethodCardActive
            ]}
            onPress={() => setPaymentMethod("gcash")}
          >
            <View style={styles.paymentMethodHeader}>
              <View style={[styles.paymentIcon, { backgroundColor: "#007DFF" }]}>
                <Ionicons name="wallet" size={24} color="#fff" />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>GCash</Text>
                <Text style={styles.paymentMethodDesc}>Fast and secure mobile wallet</Text>
              </View>
              <View style={[
                styles.radioCircle,
                paymentMethod === "gcash" && styles.radioCircleSelected
              ]}>
                {paymentMethod === "gcash" && <View style={styles.radioInner} />}
              </View>
            </View>

            {paymentMethod === "gcash" && (
              <View style={styles.paymentForm}>
                <Text style={styles.inputLabel}>GCash Mobile Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="phone-portrait-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="09XX XXX XXXX"
                    value={gcashNumber}
                    onChangeText={setGcashNumber}
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Credit/Debit Card */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              paymentMethod === "card" && styles.paymentMethodCardActive
            ]}
            onPress={() => setPaymentMethod("card")}
          >
            <View style={styles.paymentMethodHeader}>
              <View style={[styles.paymentIcon, { backgroundColor: "#FF6B35" }]}>
                <Ionicons name="card" size={24} color="#fff" />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>Credit/Debit Card</Text>
                <Text style={styles.paymentMethodDesc}>Visa, Mastercard, or other cards</Text>
              </View>
              <View style={[
                styles.radioCircle,
                paymentMethod === "card" && styles.radioCircleSelected
              ]}>
                {paymentMethod === "card" && <View style={styles.radioInner} />}
              </View>
            </View>

            {paymentMethod === "card" && (
              <View style={styles.paymentForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChangeText={setCardNumber}
                      keyboardType="number-pad"
                      maxLength={19}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Cardholder Name</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="John Doe"
                      value={cardName}
                      onChangeText={setCardName}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                      <TextInput
                        style={styles.input}
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChangeText={setExpiryDate}
                        keyboardType="number-pad"
                        maxLength={5}
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#666" />
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        value={cvv}
                        onChangeText={setCvv}
                        keyboardType="number-pad"
                        maxLength={3}
                        secureTextEntry
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Bank Transfer */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              paymentMethod === "bank" && styles.paymentMethodCardActive
            ]}
            onPress={() => setPaymentMethod("bank")}
          >
            <View style={styles.paymentMethodHeader}>
              <View style={[styles.paymentIcon, { backgroundColor: "#4CAF50" }]}>
                <Ionicons name="business" size={24} color="#fff" />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>Bank Transfer</Text>
                <Text style={styles.paymentMethodDesc}>Direct bank-to-bank transfer</Text>
              </View>
              <View style={[
                styles.radioCircle,
                paymentMethod === "bank" && styles.radioCircleSelected
              ]}>
                {paymentMethod === "bank" && <View style={styles.radioInner} />}
              </View>
            </View>

            {paymentMethod === "bank" && (
              <View style={styles.paymentForm}>
                <View style={styles.bankInfoBox}>
                  <Text style={styles.bankInfoTitle}>Transfer to:</Text>
                  <Text style={styles.bankInfoText}>Bank: BDO Unibank</Text>
                  <Text style={styles.bankInfoText}>Account Name: PropertyPro Escrow</Text>
                  <Text style={styles.bankInfoText}>Account Number: 1234-5678-9012</Text>
                  <Text style={styles.bankInfoNote}>
                    Please use your booking reference as the transfer description
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.securityText}>
            Your payment is secured with end-to-end encryption and held in escrow
          </Text>
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            (!paymentMethod || isProcessing) && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={!paymentMethod || isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.payButtonText}>Processing...</Text>
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color="#fff" />
              <Text style={styles.payButtonText}>Pay ₱{totalAmount.toLocaleString()}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  propertyInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  propertyIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  propertyDetails: {
    flex: 1,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 13,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    width: 70,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  priceBreakdown: {
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  paymentSection: {
    marginBottom: 16,
  },
  paymentMethodCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  paymentMethodCardActive: {
    borderColor: "#007AFF",
  },
  paymentMethodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  paymentMethodDesc: {
    fontSize: 12,
    color: "#666",
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#007AFF",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#007AFF",
  },
  paymentForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  bankInfoBox: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  bankInfoTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  bankInfoText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  bankInfoNote: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    gap: 10,
    marginBottom: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: "#2E7D32",
  },
  payButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type PaymentMethod = "gcash" | "card" | "bank";

export default function PaymentPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  // Mock booking details
  const bookingDetails = {
    propertyName: "Sunshine Apartments Unit 3A",
    propertyAddress: "123 Main St, Makati City",
    monthlyRent: 15000,
    securityDeposit: 15000,
    advanceRent: 15000,
    processingFee: 500,
  };

  const totalAmount = bookingDetails.monthlyRent + bookingDetails.securityDeposit + bookingDetails.advanceRent + bookingDetails.processingFee;

  const handlePayment = () => {
    if (!selectedMethod) {
      Alert.alert("Error", "Please select a payment method.");
      return;
    }

    // Validate based on payment method
    if (selectedMethod === "gcash" && !gcashNumber) {
      Alert.alert("Error", "Please enter your GCash number.");
      return;
    }

    if (selectedMethod === "card") {
      if (!cardNumber || !cardExpiry || !cardCVV || !cardName) {
        Alert.alert("Error", "Please fill in all card details.");
        return;
      }
    }

    if (selectedMethod === "bank") {
      if (!bankName || !accountNumber || !accountName) {
        Alert.alert("Error", "Please fill in all bank transfer details.");
        return;
      }
    }

    // Process payment
    Alert.alert(
      "Confirm Payment",
      `You are about to pay ₱${totalAmount.toLocaleString()} for ${bookingDetails.propertyName}. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            // Simulate payment processing
            setTimeout(() => {
              Alert.alert(
                "Payment Successful! 🎉",
                "Your payment has been processed successfully. Your booking is now confirmed!",
                [
                  {
                    text: "OK",
                    onPress: () => router.replace("/tenant/home")
                  }
                ]
              );
            }, 1500);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
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

      <ScrollView style={styles.content}>
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.propertyInfo}>
            <Ionicons name="home" size={24} color="#007AFF" />
            <View style={styles.propertyDetails}>
              <Text style={styles.propertyName}>{bookingDetails.propertyName}</Text>
              <Text style={styles.propertyAddress}>{bookingDetails.propertyAddress}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.breakdownList}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Monthly Rent</Text>
              <Text style={styles.breakdownValue}>₱{bookingDetails.monthlyRent.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Security Deposit (1 month)</Text>
              <Text style={styles.breakdownValue}>₱{bookingDetails.securityDeposit.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Advance Rent (1 month)</Text>
              <Text style={styles.breakdownValue}>₱{bookingDetails.advanceRent.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Processing Fee</Text>
              <Text style={styles.breakdownValue}>₱{bookingDetails.processingFee.toLocaleString()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.breakdownRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₱{totalAmount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          {/* GCash */}
          <TouchableOpacity
            style={[styles.paymentMethodCard, selectedMethod === "gcash" && styles.paymentMethodCardActive]}
            onPress={() => setSelectedMethod("gcash")}
          >
            <View style={styles.paymentMethodIcon}>
              <Ionicons name="phone-portrait" size={28} color={selectedMethod === "gcash" ? "#007AFF" : "#666"} />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodTitle, selectedMethod === "gcash" && styles.paymentMethodTitleActive]}>
                GCash
              </Text>
              <Text style={styles.paymentMethodDesc}>Fast and secure mobile payment</Text>
            </View>
            {selectedMethod === "gcash" && (
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>

          {selectedMethod === "gcash" && (
            <View style={styles.paymentForm}>
              <Text style={styles.formLabel}>GCash Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="09XX XXX XXXX"
                value={gcashNumber}
                onChangeText={setGcashNumber}
                keyboardType="phone-pad"
                maxLength={11}
              />
              <Text style={styles.formHint}>You will receive a GCash payment request</Text>
            </View>
          )}

          {/* Credit/Debit Card */}
          <TouchableOpacity
            style={[styles.paymentMethodCard, selectedMethod === "card" && styles.paymentMethodCardActive]}
            onPress={() => setSelectedMethod("card")}
          >
            <View style={styles.paymentMethodIcon}>
              <Ionicons name="card" size={28} color={selectedMethod === "card" ? "#007AFF" : "#666"} />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodTitle, selectedMethod === "card" && styles.paymentMethodTitleActive]}>
                Credit/Debit Card
              </Text>
              <Text style={styles.paymentMethodDesc}>Visa, Mastercard, JCB accepted</Text>
            </View>
            {selectedMethod === "card" && (
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>

          {selectedMethod === "card" && (
            <View style={styles.paymentForm}>
              <Text style={styles.formLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="JUAN DELA CRUZ"
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="characters"
              />

              <Text style={styles.formLabel}>Card Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="number-pad"
                maxLength={19}
              />

              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <Text style={styles.formLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View style={styles.formColumn}>
                  <Text style={styles.formLabel}>CVV</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="123"
                    value={cardCVV}
                    onChangeText={setCardCVV}
                    keyboardType="number-pad"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>
          )}

          {/* Bank Transfer */}
          <TouchableOpacity
            style={[styles.paymentMethodCard, selectedMethod === "bank" && styles.paymentMethodCardActive]}
            onPress={() => setSelectedMethod("bank")}
          >
            <View style={styles.paymentMethodIcon}>
              <Ionicons name="business" size={28} color={selectedMethod === "bank" ? "#007AFF" : "#666"} />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodTitle, selectedMethod === "bank" && styles.paymentMethodTitleActive]}>
                Bank Transfer
              </Text>
              <Text style={styles.paymentMethodDesc}>Direct bank to bank transfer</Text>
            </View>
            {selectedMethod === "bank" && (
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>

          {selectedMethod === "bank" && (
            <View style={styles.paymentForm}>
              <Text style={styles.formLabel}>Bank Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., BDO, BPI, Metrobank"
                value={bankName}
                onChangeText={setBankName}
              />

              <Text style={styles.formLabel}>Account Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="1234567890"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="number-pad"
              />

              <Text style={styles.formLabel}>Account Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Your full name"
                value={accountName}
                onChangeText={setAccountName}
              />

              <Text style={styles.formHint}>
                After submitting, you'll receive bank details to complete the transfer
              </Text>
            </View>
          )}
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure. We never store your card details.
          </Text>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, !selectedMethod && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={!selectedMethod}
        >
          <Ionicons name="lock-closed" size={20} color="#fff" />
          <Text style={styles.payButtonText}>
            Pay ₱{totalAmount.toLocaleString()}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          By proceeding, you agree to our Terms of Service and Payment Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  propertyInfo: {
    flexDirection: "row",
    marginBottom: 12,
  },
  propertyDetails: {
    flex: 1,
    marginLeft: 12,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "600",
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
  breakdownList: {
    gap: 10,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 14,
    color: "#666",
  },
  breakdownValue: {
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  paymentMethodCardActive: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  paymentMethodIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  paymentMethodTitleActive: {
    color: "#007AFF",
  },
  paymentMethodDesc: {
    fontSize: 12,
    color: "#999",
  },
  paymentForm: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 8,
  },
  formInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formColumn: {
    flex: 1,
  },
  formHint: {
    fontSize: 11,
    color: "#999",
    marginTop: 6,
    fontStyle: "italic",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: "#2E7D32",
    lineHeight: 18,
  },
  footer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  payButtonDisabled: {
    backgroundColor: "#ccc",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  footerNote: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    lineHeight: 16,
  },
});

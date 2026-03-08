import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import API_ENDPOINTS from "../../config/api";

type PaymentMethod = "gcash" | "card" | "bank_transfer" | "cash";

export default function PaymentPage() {
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
  const securityDeposit = monthlyRent;
  const totalAmount = Number(params.amount ?? monthlyRent * 2);
  const propertyName = params.property_name ?? "Property";
  const propertyAddress = params.property_address ?? "";

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [processing, setProcessing] = useState(false);

  const handlePayment = () => {
    if (!selectedMethod) { Alert.alert("Error", "Please select a payment method."); return; }
    if (selectedMethod === "gcash" && !gcashNumber) { Alert.alert("Error", "Please enter your GCash number."); return; }
    if (selectedMethod === "card" && (!cardNumber || !cardExpiry || !cardCVV || !cardName)) { Alert.alert("Error", "Please fill in all card details."); return; }
    if (selectedMethod === "bank_transfer" && (!bankName || !accountNumber || !accountName)) { Alert.alert("Error", "Please fill in all bank transfer details."); return; }

    Alert.alert(
      "Confirm Payment",
      `Pay ₱${totalAmount.toLocaleString()} for ${propertyName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setProcessing(true);
            try {
              const res = await fetch(API_ENDPOINTS.PAYMENT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ booking_id: Number(bookingId), amount: totalAmount, method: selectedMethod }),
              });
              const data = await res.json();
              if (data.status === "success") {
                Alert.alert("Payment Successful!", `Transaction ID: ${data.transaction_id}\n\nYour booking is now confirmed!`,
                  [{ text: "OK", onPress: () => router.replace("/tenant/home") }]);
              } else {
                Alert.alert("Payment Failed", data.message ?? "Please try again.");
              }
            } catch {
              Alert.alert("Connection Error", "Could not reach the server. Please check your connection.");
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Payment</Text>
          <Text style={styles.headerSubtitle}>Complete your booking payment</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.propertyInfo}>
            <Ionicons name="home" size={24} color="#007AFF" />
            <View style={styles.propertyDetails}>
              <Text style={styles.propertyName}>{propertyName}</Text>
              <Text style={styles.propertyAddress}>{propertyAddress}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownList}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Monthly Rent</Text>
              <Text style={styles.breakdownValue}>₱{monthlyRent.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Security Deposit (1 month)</Text>
              <Text style={styles.breakdownValue}>₱{securityDeposit.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₱{totalAmount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          {(["cash","gcash","card","bank_transfer"] as PaymentMethod[]).map((method) => (
            <View key={method}>
              <TouchableOpacity
                style={[styles.paymentMethodCard, selectedMethod === method && styles.paymentMethodCardActive]}
                onPress={() => setSelectedMethod(method)}
              >
                <View style={styles.paymentMethodIcon}>
                  <Ionicons
                    name={method === "cash" ? "cash" : method === "gcash" ? "phone-portrait" : method === "card" ? "card" : "business"}
                    size={28}
                    color={selectedMethod === method ? "#007AFF" : "#666"}
                  />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={[styles.paymentMethodTitle, selectedMethod === method && styles.paymentMethodTitleActive]}>
                    {method === "cash" ? "Cash" : method === "gcash" ? "GCash" : method === "card" ? "Credit/Debit Card" : "Bank Transfer"}
                  </Text>
                  <Text style={styles.paymentMethodDesc}>
                    {method === "cash" ? "Pay in person to the property owner"
                      : method === "gcash" ? "Fast and secure mobile payment"
                      : method === "card" ? "Visa, Mastercard, JCB accepted"
                      : "Direct bank to bank transfer"}
                  </Text>
                </View>
                {selectedMethod === method && <Ionicons name="checkmark-circle" size={24} color="#007AFF" />}
              </TouchableOpacity>

              {selectedMethod === "gcash" && method === "gcash" && (
                <View style={styles.paymentForm}>
                  <Text style={styles.formLabel}>GCash Number</Text>
                  <TextInput style={styles.formInput} placeholder="09XX XXX XXXX" value={gcashNumber} onChangeText={setGcashNumber} keyboardType="phone-pad" maxLength={11} />
                </View>
              )}

              {selectedMethod === "card" && method === "card" && (
                <View style={styles.paymentForm}>
                  <Text style={styles.formLabel}>Cardholder Name</Text>
                  <TextInput style={styles.formInput} placeholder="JUAN DELA CRUZ" value={cardName} onChangeText={setCardName} autoCapitalize="characters" />
                  <Text style={styles.formLabel}>Card Number</Text>
                  <TextInput style={styles.formInput} placeholder="1234 5678 9012 3456" value={cardNumber} onChangeText={setCardNumber} keyboardType="number-pad" maxLength={19} />
                  <View style={styles.formRow}>
                    <View style={styles.formColumn}>
                      <Text style={styles.formLabel}>Expiry Date</Text>
                      <TextInput style={styles.formInput} placeholder="MM/YY" value={cardExpiry} onChangeText={setCardExpiry} keyboardType="number-pad" maxLength={5} />
                    </View>
                    <View style={styles.formColumn}>
                      <Text style={styles.formLabel}>CVV</Text>
                      <TextInput style={styles.formInput} placeholder="123" value={cardCVV} onChangeText={setCardCVV} keyboardType="number-pad" maxLength={3} secureTextEntry />
                    </View>
                  </View>
                </View>
              )}

              {selectedMethod === "bank_transfer" && method === "bank_transfer" && (
                <View style={styles.paymentForm}>
                  <Text style={styles.formLabel}>Bank Name</Text>
                  <TextInput style={styles.formInput} placeholder="e.g., BDO, BPI, Metrobank" value={bankName} onChangeText={setBankName} />
                  <Text style={styles.formLabel}>Account Number</Text>
                  <TextInput style={styles.formInput} placeholder="1234567890" value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" />
                  <Text style={styles.formLabel}>Account Name</Text>
                  <TextInput style={styles.formInput} placeholder="Your full name" value={accountName} onChangeText={setAccountName} />
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.securityText}>Your payment is recorded securely in our system.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, (!selectedMethod || processing) && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={!selectedMethod || processing}
        >
          <Ionicons name="lock-closed" size={20} color="#fff" />
          <Text style={styles.payButtonText}>{processing ? "Processing..." : `Pay ₱${totalAmount.toLocaleString()}`}</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>By proceeding, you agree to our Terms of Service and Payment Policy</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  backButton: { marginRight: 12, padding: 4 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: "#666" },
  content: { flex: 1, padding: 16 },
  summaryCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  summaryTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 16 },
  propertyInfo: { flexDirection: "row", marginBottom: 12 },
  propertyDetails: { flex: 1, marginLeft: 12 },
  propertyName: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  propertyAddress: { fontSize: 13, color: "#666" },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 12 },
  breakdownList: { gap: 10 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  breakdownLabel: { fontSize: 14, color: "#666" },
  breakdownValue: { fontSize: 14, fontWeight: "600", color: "#333" },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#333" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#007AFF" },
  sectionCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 16 },
  paymentMethodCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 8, borderWidth: 2, borderColor: "#e0e0e0", marginBottom: 12, backgroundColor: "#fff" },
  paymentMethodCardActive: { borderColor: "#007AFF", backgroundColor: "#F0F8FF" },
  paymentMethodIcon: { width: 50, height: 50, borderRadius: 8, backgroundColor: "#f5f5f5", alignItems: "center", justifyContent: "center", marginRight: 12 },
  paymentMethodInfo: { flex: 1 },
  paymentMethodTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 2 },
  paymentMethodTitleActive: { color: "#007AFF" },
  paymentMethodDesc: { fontSize: 12, color: "#999" },
  paymentForm: { backgroundColor: "#f9f9f9", padding: 16, borderRadius: 8, marginBottom: 12 },
  formLabel: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6, marginTop: 8 },
  formInput: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, fontSize: 14, color: "#333" },
  formRow: { flexDirection: "row", gap: 12 },
  formColumn: { flex: 1 },
  securityNotice: { flexDirection: "row", alignItems: "center", backgroundColor: "#E8F5E9", padding: 12, borderRadius: 8, gap: 8, marginBottom: 16 },
  securityText: { flex: 1, fontSize: 12, color: "#2E7D32", lineHeight: 18 },
  footer: { backgroundColor: "#fff", padding: 16, borderTopWidth: 1, borderTopColor: "#e0e0e0" },
  payButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#4CAF50", paddingVertical: 16, borderRadius: 8, gap: 8, marginBottom: 8 },
  payButtonDisabled: { backgroundColor: "#ccc" },
  payButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  footerNote: { fontSize: 11, color: "#999", textAlign: "center", lineHeight: 16 },
});

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PropertyReview() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Application Submitted Successfully!</Text>
        <Text style={styles.subtitle}>
          Your property listing is now under review
        </Text>

        {/* Review Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="time-outline" size={24} color="#FF9800" />
            <Text style={styles.statusTitle}>Under Review</Text>
          </View>
          <Text style={styles.statusDescription}>
            Our team is currently reviewing your property submission. This process typically takes 2-3 business days.
          </Text>
        </View>

        {/* What Happens Next Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What Happens Next?</Text>
          
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Document Verification</Text>
                <Text style={styles.stepDescription}>
                  We'll verify your ownership documents and identity
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Property Review</Text>
                <Text style={styles.stepDescription}>
                  Our team will check property details and compliance
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Approval & Go Live</Text>
                <Text style={styles.stepDescription}>
                  Once approved, your property will be published and visible to tenants
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notification Card */}
        <View style={styles.notificationCard}>
          <Ionicons name="notifications-outline" size={24} color="#1565D8" />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>We'll Keep You Updated</Text>
            <Text style={styles.notificationText}>
              You'll receive email and push notifications about your application status
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push("/owner/home")}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push("/owner/properties")}
          >
            <Text style={styles.secondaryButtonText}>View My Properties</Text>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.supportSection}>
          <Text style={styles.supportText}>
            Have questions? Contact our support team
          </Text>
          <TouchableOpacity>
            <Text style={styles.supportLink}>support@padfinder.com</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  content: { padding: 20, paddingTop: 40 },
  
  // Icon Section
  iconContainer: { alignItems: "center", marginBottom: 24 },
  iconCircle: { backgroundColor: "#E8F5E9", width: 120, height: 120, borderRadius: 60, justifyContent: "center", alignItems: "center" },
  
  // Title Section
  title: { fontSize: 26, fontWeight: "700", color: "#333", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 32 },
  
  // Status Card
  statusCard: { backgroundColor: "#FFF3E0", padding: 20, borderRadius: 12, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: "#FF9800" },
  statusHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  statusTitle: { fontSize: 18, fontWeight: "700", color: "#E65100" },
  statusDescription: { fontSize: 14, color: "#E65100", lineHeight: 22 },
  
  // Info Card
  infoCard: { backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  infoTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 20 },
  
  // Steps List
  stepsList: { gap: 20 },
  stepItem: { flexDirection: "row", gap: 16 },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1565D8", justifyContent: "center", alignItems: "center" },
  stepNumberText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  stepDescription: { fontSize: 14, color: "#666", lineHeight: 20 },
  
  // Notification Card
  notificationCard: { backgroundColor: "#E3F2FD", padding: 16, borderRadius: 12, flexDirection: "row", gap: 12, marginBottom: 32 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 15, fontWeight: "600", color: "#0D47A1", marginBottom: 4 },
  notificationText: { fontSize: 13, color: "#1565D8", lineHeight: 18 },
  
  // Buttons
  buttonGroup: { gap: 12, marginBottom: 24 },
  primaryButton: { backgroundColor: "#1565D8", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryButton: { backgroundColor: "#fff", paddingVertical: 16, borderRadius: 12, alignItems: "center", borderWidth: 2, borderColor: "#1565D8" },
  secondaryButtonText: { color: "#1565D8", fontSize: 16, fontWeight: "600" },
  
  // Support Section
  supportSection: { alignItems: "center", paddingVertical: 20 },
  supportText: { fontSize: 14, color: "#666", marginBottom: 8 },
  supportLink: { fontSize: 14, color: "#1565D8", fontWeight: "600", textDecorationLine: "underline" },
});

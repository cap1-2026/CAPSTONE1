import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PendingApprovalPage() {
  const router = useRouter();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Create pulsing animation for the clock icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={60} color="#fff" />
          </View>
          <Animated.View style={[styles.clockIconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="time-outline" size={40} color="#FF9800" />
          </Animated.View>
        </View>

        {/* Main Message */}
        <Text style={styles.title}>Booking Request Submitted!</Text>
        <Text style={styles.subtitle}>
          Your booking request has been successfully submitted and is now waiting for owner approval.
        </Text>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.statusTitle}>What Happens Next?</Text>
          </View>
          
          <View style={styles.timeline}>
            {/* Step 1 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={[styles.timelineDot, styles.timelineDotCompleted]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Request Submitted ✓</Text>
                <Text style={styles.timelineText}>
                  Your booking request and documents have been sent to the property owner.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={[styles.timelineDot, styles.timelineDotActive]}>
                  <Ionicons name="time" size={16} color="#FF9800" />
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Owner Review (In Progress)</Text>
                <Text style={styles.timelineText}>
                  The owner will review your application and documents. This usually takes 24-48 hours.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={styles.timelineDot}>
                  <Ionicons name="notifications-outline" size={16} color="#999" />
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Notification</Text>
                <Text style={styles.timelineText}>
                  You'll receive a notification once the owner approves or requests more information.
                </Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={styles.timelineDot}>
                  <Ionicons name="card-outline" size={16} color="#999" />
                </View>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Payment & Move-in</Text>
                <Text style={styles.timelineText}>
                  Once approved, you can proceed with payment and receive your digital keys!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Information Cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Ionicons name="mail-outline" size={28} color="#007AFF" />
            <Text style={styles.infoCardTitle}>Check Your Email</Text>
            <Text style={styles.infoCardText}>
              We've sent a confirmation email with your booking details.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="notifications-outline" size={28} color="#007AFF" />
            <Text style={styles.infoCardTitle}>Stay Updated</Text>
            <Text style={styles.infoCardText}>
              Enable push notifications to get instant updates on your booking status.
            </Text>
          </View>
        </View>

        {/* Tips Box */}
        <View style={styles.tipsBox}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color="#FF9800" />
            <Text style={styles.tipsTitle}>Tips While You Wait</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>📱 Keep your phone notifications on</Text>
            <Text style={styles.tipItem}>📧 Check your email regularly (including spam folder)</Text>
            <Text style={styles.tipItem}>⏰ Response time is usually within 24-48 hours</Text>
            <Text style={styles.tipItem}>💬 You can message the owner if you have questions</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push("/tenant/approvals")}
          >
            <Ionicons name="list" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>View All My Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push("/tenant/browse-properties")}
          >
            <Ionicons name="search" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Browse More Properties</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.ghostButton}
            onPress={() => router.push("/tenant/home")}
          >
            <Ionicons name="home-outline" size={20} color="#666" />
            <Text style={styles.ghostButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: 30,
    position: "relative",
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  clockIconContainer: {
    position: "absolute",
    bottom: -10,
    right: "30%",
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  timeline: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timelineIconContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  timelineDotCompleted: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  timelineDotActive: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e0e0e0",
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  timelineText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  infoCards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  infoCardText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  tipsBox: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F57C00",
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: "#F57C00",
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 2,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "700",
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ghostButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

export default function RegistrationConfirmation() {
  const { role, email } = useLocalSearchParams() as { role?: string; email?: string };
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  const roleColor = role === "owner" ? "#1565D8" : "#007AFF";
  const displayRole = role === "owner" ? "Property Owner" : "Tenant";

  useEffect(() => {
    // Animate success icon
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.replace({ pathname: "/login/[role]", params: { role: role ?? "tenant" } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLoginNow = () => {
    router.replace({ pathname: "/login/[role]", params: { role: role ?? "tenant" } });
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient Effect */}
      <View style={[styles.backgroundCircle, styles.circle1, { backgroundColor: roleColor + "20" }]} />
      <View style={[styles.backgroundCircle, styles.circle2, { backgroundColor: roleColor + "10" }]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Success Icon with Animation */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.iconCircle, { backgroundColor: roleColor }]}>
            <Ionicons name="checkmark" size={80} color="#fff" />
          </View>
        </Animated.View>

        {/* Success Message */}
        <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
          <Text style={styles.successTitle}>Registration Successful!</Text>
          <Text style={styles.successSubtitle}>
            Welcome to PadFinder
          </Text>

          {/* User Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color={roleColor} />
              <Text style={styles.infoText}>{email || "User"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={roleColor} />
              <Text style={styles.infoText}>Registered as {displayRole}</Text>
            </View>
          </View>

          {/* Success Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.detailText}>Account created successfully</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.detailText}>Profile information saved</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.detailText}>Ready to explore properties</Text>
            </View>
          </View>

          {/* Auto Redirect Info */}
          <View style={styles.redirectContainer}>
            <Ionicons name="time-outline" size={24} color="#666" />
            <Text style={styles.redirectText}>
              Redirecting to login in <Text style={[styles.countdown, { color: roleColor }]}>{countdown}</Text> seconds...
            </Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              { backgroundColor: pressed ? roleColor + "E0" : roleColor },
            ]}
            onPress={handleLoginNow}
          >
            <Text style={styles.loginButtonText}>Login Now</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.homeButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 PadFinder. All rights reserved.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    position: "relative",
  },
  backgroundCircle: {
    position: "absolute",
    borderRadius: 9999,
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 250,
    height: 250,
    bottom: -50,
    left: -80,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  messageContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  detailsContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: "#555",
    marginLeft: 12,
  },
  redirectContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  redirectText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  countdown: {
    fontSize: 16,
    fontWeight: "700",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  homeButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  homeButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
  },
});

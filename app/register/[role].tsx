import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function RoleRegister() {
  const { role } = useLocalSearchParams() as { role?: string };
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const displayRole = role === "owner" ? "Property Owner" : "Tenant";
  const roleColor = role === "owner" ? "#1565D8" : "#007AFF";

  function handleRegister() {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Validation", "Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match");
      return;
    }

    // Mock registration: in a real app call API to create user and return success
    Alert.alert("Success", `Account created for ${displayRole}`);
    const r = (role || "tenant") as "tenant" | "owner";
    const target: "/tenant/home" | "/owner/home" = r === "tenant" ? "/tenant/home" : "/owner/home";
    router.replace(target);
  }

  return (
    <KeyboardAvoidingView 
      style={styles.wrapper} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Hero Header */}
        <View style={[styles.header, { backgroundColor: roleColor }]}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="home" size={40} color="#fff" />
              <Text style={styles.logoText}>PadFinder</Text>
            </View>
            <Text style={styles.headerSubtitle}>Find Your Perfect Space</Text>
          </View>
          <View style={styles.waveContainer}>
            <View style={styles.wave} />
          </View>
        </View>

        {/* Register Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.roleText}>Register as {displayRole}</Text>
          </View>

          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms & Conditions */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By registering, you agree to our{" "}
              <Text style={[styles.termsLink, { color: roleColor }]}>Terms & Conditions</Text>
              {" "}and{" "}
              <Text style={[styles.termsLink, { color: roleColor }]}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity 
            style={[styles.registerButton, { backgroundColor: roleColor }]}
            onPress={handleRegister}
          >
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login Link */}
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => router.push({ pathname: "/login/[role]", params: { role: role ?? "tenant" } })}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={[styles.loginLinkBold, { color: roleColor }]}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 PadFinder. All rights reserved.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#f5f7fa" },
  container: { flexGrow: 1 },
  header: { paddingTop: 60, paddingBottom: 80, paddingHorizontal: 20, position: "relative" },
  headerContent: { alignItems: "center", zIndex: 1 },
  logoContainer: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  logoText: { fontSize: 36, fontWeight: "800", color: "#fff" },
  headerSubtitle: { fontSize: 16, color: "#fff", opacity: 0.9 },
  waveContainer: { position: "absolute", bottom: -1, left: 0, right: 0, height: 30, overflow: "hidden" },
  wave: { position: "absolute", bottom: -10, left: 0, right: 0, height: 40, backgroundColor: "#f5f7fa", borderTopLeftRadius: 50, borderTopRightRadius: 50 },
  card: { backgroundColor: "#fff", marginHorizontal: 20, marginTop: -30, borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, elevation: 8, marginBottom: 20 },
  cardHeader: { marginBottom: 24, alignItems: "center" },
  welcomeText: { fontSize: 28, fontWeight: "700", color: "#333", marginBottom: 4 },
  roleText: { fontSize: 14, color: "#666" },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9f9f9", borderRadius: 12, borderWidth: 1, borderColor: "#e0e0e0", paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#333" },
  eyeButton: { padding: 4 },
  termsContainer: { marginVertical: 16 },
  termsText: { fontSize: 12, color: "#666", textAlign: "center", lineHeight: 18 },
  termsLink: { fontWeight: "600", textDecorationLine: "underline" },
  registerButton: { paddingVertical: 16, borderRadius: 12, alignItems: "center", marginBottom: 20 },
  registerButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e0e0e0" },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: "#999" },
  loginLink: { alignItems: "center", paddingVertical: 12 },
  loginLinkText: { fontSize: 14, color: "#666" },
  loginLinkBold: { fontWeight: "700" },
  footer: { paddingVertical: 30, alignItems: "center" },
  footerText: { fontSize: 12, color: "#999" },
});

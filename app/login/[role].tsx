import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

export default function RoleLogin() {
  const { role } = useLocalSearchParams() as { role?: string };
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOwner = role === "owner";
  const displayRole = isOwner ? "Property Owner" : "Tenant";
  const accentColor = isOwner ? "#7C3AED" : "#2563EB";
  const accentLight = isOwner ? "#F5F3FF" : "#EFF6FF";
  const accentBorder = isOwner ? "#E9D5FF" : "#BFDBFE";

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.status === "success") {
        if (data.role !== role) {
          Alert.alert("Wrong Account", `This account is registered as a ${data.role}. Please use the correct login.`);
          return;
        }
        await UserStorage.saveUser({ user_id: data.user_id, email: data.email, fullname: data.fullname, role: data.role });
        if (data.role === "owner") router.replace("/owner/home");
        else router.replace("/tenant/home");
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials. Please try again.");
      }
    } catch {
      Alert.alert("Connection Error", "Cannot connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.roleChip, { backgroundColor: accentLight, borderColor: accentBorder }]}>
            <Ionicons name={isOwner ? "key" : "search"} size={15} color={accentColor} />
            <Text style={[styles.roleChipText, { color: accentColor }]}>{displayRole}</Text>
          </View>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.welcomeSub}>Sign in to your PadFinder account</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#C4C9D4"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TouchableOpacity>
                <Text style={[styles.forgotText, { color: accentColor }]}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#C4C9D4"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: accentColor }, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <Text style={styles.loginBtnText}>Signing in...</Text>
              : <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Don't have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register */}
          <TouchableOpacity
            style={[styles.registerBtn, { borderColor: accentBorder }]}
            onPress={() => router.push({ pathname: "/register/[role]", params: { role: role ?? "tenant" } })}
          >
            <Text style={[styles.registerBtnText, { color: accentColor }]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Row */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.trustText}>SSL Secured</Text>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={16} color="#10B981" />
            <Text style={styles.trustText}>Encrypted Data</Text>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.trustText}>Verified Platform</Text>
          </View>
        </View>

        <Text style={styles.footerText}>© 2026 PadFinder. All rights reserved.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { paddingBottom: 40 },
  topBar: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  headerSection: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  roleChip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  roleChipText: { fontSize: 13, fontWeight: "600" },
  welcomeTitle: { fontSize: 30, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5, marginBottom: 6 },
  welcomeSub: { fontSize: 15, color: "#64748B" },
  formCard: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, padding: 24, shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, marginBottom: 24 },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  forgotText: { fontSize: 13, fontWeight: "500" },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: "#1E293B" },
  eyeBtn: { padding: 4 },
  loginBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 4, marginBottom: 20 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerText: { fontSize: 13, color: "#94A3B8" },
  registerBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1.5 },
  registerBtnText: { fontSize: 15, fontWeight: "700" },
  trustRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24, marginBottom: 16 },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  trustText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  trustDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#CBD5E1" },
  footerText: { textAlign: "center", fontSize: 12, color: "#94A3B8" },
});
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";

// Admin credentials (hardcoded — replace with API in production)
const ADMIN_EMAIL = "admin@padfinder.com";
const ADMIN_PASSWORD = "Admin@2026";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter your admin credentials.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        router.replace("/admin/dashboard" as any);
      } else {
        Alert.alert("Access Denied", "Invalid admin credentials. Please try again.");
      }
    }, 800);
  }

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield" size={28} color="#fff" />
          </View>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Restricted access — authorized personnel only</Text>
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={16} color="#92400E" />
          <Text style={styles.warningText}>This portal is for PadFinder administrators only.</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Administrator Sign In</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Admin Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="admin@padfinder.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#C4C9D4"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.icon} />
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                placeholder="Enter admin password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                placeholderTextColor="#C4C9D4"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? "eye-outline" : "eye-off-outline"} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name="shield-checkmark" size={18} color="#fff" />
            <Text style={styles.loginBtnText}>{loading ? "Verifying..." : "Access Admin Panel"}</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Credentials Hint */}
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>Demo Credentials</Text>
          <Text style={styles.hintLine}>Email: admin@padfinder.com</Text>
          <Text style={styles.hintLine}>Password: Admin@2026</Text>
        </View>

        <Text style={styles.footer}>© 2026 PadFinder Admin Portal</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F1F5F9" },
  container: { paddingBottom: 40 },
  topBar: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },

  header: { alignItems: "center", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  adminBadge: { width: 72, height: 72, borderRadius: 20, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center", marginBottom: 16, shadowColor: "#0F172A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  title: { fontSize: 28, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#64748B", textAlign: "center" },

  warningBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF3C7", borderRadius: 10, marginHorizontal: 16, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#FDE68A" },
  warningText: { fontSize: 13, color: "#92400E", flex: 1, fontWeight: "500" },

  formCard: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6, marginBottom: 16 },
  formTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 20 },

  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14 },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: "#1E293B" },
  eyeBtn: { padding: 4 },

  loginBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#0F172A", paddingVertical: 15, borderRadius: 12, marginTop: 8 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  hintBox: { marginHorizontal: 16, backgroundColor: "#F0FDF4", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#BBF7D0", marginBottom: 20 },
  hintTitle: { fontSize: 13, fontWeight: "700", color: "#166534", marginBottom: 6 },
  hintLine: { fontSize: 13, color: "#15803D", marginBottom: 2, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },

  footer: { textAlign: "center", fontSize: 12, color: "#94A3B8" },
});
// app/register/[role].tsx
// Works for both "tenant" and "owner" roles
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import API_ENDPOINTS from "../../config/api";

export default function RegisterScreen() {
  const { role } = useLocalSearchParams() as { role?: string };
  const router   = useRouter();

  const isOwner      = role === "owner";
  const displayRole  = isOwner ? "Property Owner" : "Tenant";
  const accentColor  = isOwner ? "#7C3AED" : "#2563EB";
  const accentLight  = isOwner ? "#F5F3FF" : "#EFF6FF";
  const accentBorder = isOwner ? "#E9D5FF" : "#BFDBFE";

  const [fullname,  setFullname]  = useState("");
  const [address,   setAddress]   = useState("");
  const [contact,   setContact]   = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [showCpw,   setShowCpw]   = useState(false);
  const [loading,   setLoading]   = useState(false);

  function validate(): boolean {
    if (!fullname.trim() || !address.trim() || !contact.trim() || !email.trim()) {
      Alert.alert("Missing Fields", "Please fill in all required fields."); return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address."); return false;
    }
    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters."); return false;
    }
    if (!/[A-Z]/.test(password)) {
      Alert.alert("Weak Password", "Password must contain at least one uppercase letter."); return false;
    }
    if (!/[a-z]/.test(password)) {
      Alert.alert("Weak Password", "Password must contain at least one lowercase letter."); return false;
    }
    if (!/[0-9]/.test(password)) {
      Alert.alert("Weak Password", "Password must contain at least one number."); return false;
    }
    if (password !== confirmPw) {
      Alert.alert("Password Mismatch", "Passwords do not match."); return false;
    }
    return true;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res  = await fetch(API_ENDPOINTS.REGISTER, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fullname, address, contact, email, password, role: role ?? "tenant" }),
      });
      const data = await res.json();

      if (data.status === "success") {
        router.replace({
          pathname: "/register/confirmation",
          params:   { role: role ?? "tenant", email },
        } as any);
      } else {
        Alert.alert("Registration Failed", data.message || "Please try again.");
      }
    } catch {
      Alert.alert("Connection Error", "Cannot reach server. Make sure XAMPP is running.");
    } finally {
      setLoading(false);
    }
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
        <View style={styles.headerSection}>
          <View style={[styles.roleChip, { backgroundColor: accentLight, borderColor: accentBorder }]}>
            <Ionicons name={isOwner ? "key" : "search"} size={15} color={accentColor} />
            <Text style={[styles.roleChipText, { color: accentColor }]}>{displayRole}</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join PadFinder as a {displayRole}</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#9CA3AF" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Juan Dela Cruz" value={fullname} onChangeText={setFullname} placeholderTextColor="#C4C9D4" />
            </View>
          </View>

          {/* Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Home Address *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="location-outline" size={18} color="#9CA3AF" style={styles.icon} />
              <TextInput style={styles.input} placeholder="123 Main St, Barangay, City" value={address} onChangeText={setAddress} placeholderTextColor="#C4C9D4" />
            </View>
          </View>

          {/* Contact */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Contact Number *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color="#9CA3AF" style={styles.icon} />
              <TextInput style={styles.input} placeholder="09XX XXX XXXX" value={contact} onChangeText={setContact} keyboardType="phone-pad" placeholderTextColor="#C4C9D4" />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.icon} />
              <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#C4C9D4" />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.icon} />
              <TextInput style={[styles.input, { paddingRight: 44 }]} placeholder="Min 8 chars, upper, lower, number" value={password} onChangeText={setPassword} secureTextEntry={!showPw} placeholderTextColor="#C4C9D4" />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? "eye-outline" : "eye-off-outline"} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm Password *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.icon} />
              <TextInput style={[styles.input, { paddingRight: 44 }]} placeholder="Re-enter password" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry={!showCpw} placeholderTextColor="#C4C9D4" />
              <TouchableOpacity onPress={() => setShowCpw(!showCpw)} style={styles.eyeBtn}>
                <Ionicons name={showCpw ? "eye-outline" : "eye-off-outline"} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password requirements hint */}
          <View style={styles.pwHints}>
            {[
              { ok: password.length >= 8,      text: "At least 8 characters" },
              { ok: /[A-Z]/.test(password),    text: "One uppercase letter" },
              { ok: /[a-z]/.test(password),    text: "One lowercase letter" },
              { ok: /[0-9]/.test(password),    text: "One number" },
            ].map((h, i) => (
              <View key={i} style={styles.pwHintRow}>
                <Ionicons name={h.ok ? "checkmark-circle" : "ellipse-outline"} size={14} color={h.ok ? "#059669" : "#CBD5E1"} />
                <Text style={[styles.pwHintText, h.ok && styles.pwHintTextOk]}>{h.text}</Text>
              </View>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: accentColor }, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>{loading ? "Creating account..." : "Create Account"}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Already have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, { borderColor: accentBorder }]}
            onPress={() => router.push({ pathname: "/login/[role]", params: { role: role ?? "tenant" } })}
          >
            <Text style={[styles.loginBtnText, { color: accentColor }]}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 PadFinder. All rights reserved.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper:        { flex: 1, backgroundColor: "#F8FAFC" },
  container:      { paddingBottom: 40 },
  topBar:         { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn:        { width: 40, height: 40, borderRadius: 10, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  headerSection:  { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  roleChip:       { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  roleChipText:   { fontSize: 13, fontWeight: "600" },
  title:          { fontSize: 28, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5, marginBottom: 6 },
  subtitle:       { fontSize: 15, color: "#64748B" },
  formCard:       { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, padding: 24, shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, marginBottom: 24 },
  fieldGroup:     { marginBottom: 16 },
  fieldLabel:     { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputWrap:      { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14 },
  icon:           { marginRight: 10 },
  input:          { flex: 1, paddingVertical: 13, fontSize: 15, color: "#1E293B" },
  eyeBtn:         { padding: 4 },
  pwHints:        { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, marginBottom: 16, gap: 6 },
  pwHintRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  pwHintText:     { fontSize: 12, color: "#94A3B8" },
  pwHintTextOk:   { color: "#059669" },
  submitBtn:      { paddingVertical: 15, borderRadius: 12, alignItems: "center", marginBottom: 20 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:  { color: "#fff", fontSize: 16, fontWeight: "700" },
  dividerRow:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerText:    { fontSize: 13, color: "#94A3B8" },
  loginBtn:       { paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1.5 },
  loginBtnText:   { fontSize: 15, fontWeight: "700" },
  footer:         { textAlign: "center", fontSize: 12, color: "#94A3B8" },
});
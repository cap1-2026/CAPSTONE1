import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserStorage } from "../utils/userStorage";

const { width: SCREEN_W } = Dimensions.get("window");
const GRID_COL = (SCREEN_W - 32 - 12) / 2; // 32 = 16*2 outer padding, 12 = gap

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    UserStorage.getUser().then((user) => {
      if (!user) return;
      if (user.role === "owner") router.replace("/owner/home" as any);
      else if (user.role === "admin") router.replace("/admin/dashboard" as any);
      else router.replace("/tenant/home" as any);
    });
  }, []);

  function goToRole(role: string) {
    router.push({ pathname: "/login/[role]", params: { role } });
  }

  const features = [
    { icon: "shield-checkmark", color: "#10B981", label: "Verified Listings" },
    { icon: "lock-closed",      color: "#3B82F6", label: "Secure Payments" },
    { icon: "flash",            color: "#F59E0B", label: "Instant Booking" },
    { icon: "document-text",    color: "#8B5CF6", label: "Digital Contracts" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <View style={styles.heroPattern} />
        <View style={styles.heroContent}>
          <View style={styles.logoRow}>
            <View style={styles.logoIconWrap}>
              <Ionicons name="home" size={28} color="#fff" />
            </View>
            <Text style={styles.logoText}>PadFinder</Text>
          </View>
          <Text style={styles.heroTitle}>Find Your Perfect{"\n"}Place to Call Home</Text>
          <Text style={styles.heroSubtitle}>
            Browse verified apartments, condos, dorms & transient rentals. Book online with secure digital contracts.
          </Text>
          <View style={styles.pillsRow}>
            <View style={styles.pill}><Ionicons name="checkmark-circle" size={13} color="#86EFAC" /><Text style={styles.pillText}>500+ listings</Text></View>
            <View style={styles.pill}><Ionicons name="star" size={13} color="#FCD34D" /><Text style={styles.pillText}>Verified owners</Text></View>
            <View style={styles.pill}><Ionicons name="shield-checkmark" size={13} color="#93C5FD" /><Text style={styles.pillText}>Escrow protected</Text></View>
          </View>
        </View>
      </View>

      {/* Card — Admin Portal link removed */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Get Started</Text>
        <Text style={styles.cardSub}>Choose how you'd like to use PadFinder</Text>

        <TouchableOpacity style={styles.roleCard} onPress={() => goToRole("tenant")} activeOpacity={0.85}>
          <View style={[styles.roleIcon, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="search" size={26} color="#2563EB" />
          </View>
          <View style={styles.roleText}>
            <Text style={styles.roleTitle}>I'm a Tenant</Text>
            <Text style={styles.roleDesc}>Find & rent your perfect home</Text>
          </View>
          <View style={styles.roleArrow}>
            <Ionicons name="chevron-forward" size={20} color="#2563EB" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.roleCard, styles.roleCardOwner]} onPress={() => goToRole("owner")} activeOpacity={0.85}>
          <View style={[styles.roleIcon, { backgroundColor: "#EDE9FE" }]}>
            <Ionicons name="key" size={26} color="#7C3AED" />
          </View>
          <View style={styles.roleText}>
            <Text style={[styles.roleTitle, { color: "#1E1B4B" }]}>I'm a Property Owner</Text>
            <Text style={styles.roleDesc}>List & manage your properties</Text>
          </View>
          <View style={[styles.roleArrow, { backgroundColor: "#EDE9FE" }]}>
            <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
          </View>
        </TouchableOpacity>
        {/* Admin Portal link removed — admins log in through either button above */}
      </View>

      {/* Why PadFinder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why PadFinder?</Text>
        <View style={styles.featuresGrid}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureBox}>
              <View style={[styles.featureIconWrap, { backgroundColor: f.color + "18" }]}>
                <Ionicons name={f.icon as any} size={22} color={f.color} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        {[
          { val: "500+",   lbl: "Properties" },
          { val: "1,200+", lbl: "Happy Tenants" },
          { val: "300+",   lbl: "Verified Owners" },
          { val: "4.9★",   lbl: "App Rating" },
        ].map((s, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={styles.statVal}>{s.val}</Text>
            <Text style={styles.statLbl}>{s.lbl}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 PadFinder. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { backgroundColor: "#F8FAFC" },
  hero:         { backgroundColor: "#1D4ED8", paddingBottom: 56, paddingHorizontal: 24, overflow: "hidden", position: "relative" },
  heroPattern:  { position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.06)" },
  heroContent:  { zIndex: 1 },
  logoRow:      { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
  logoIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  logoText:     { fontSize: 26, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroTitle:    { fontSize: 32, fontWeight: "800", color: "#fff", lineHeight: 40, marginBottom: 12, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 15, color: "#BFDBFE", lineHeight: 22, marginBottom: 20 },
  pillsRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill:         { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pillText:     { fontSize: 12, color: "#fff", fontWeight: "500" },
  card:         { backgroundColor: "#fff", marginHorizontal: 16, marginTop: -24, borderRadius: 20, padding: 24, shadowColor: "#1D4ED8", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 10, marginBottom: 20 },
  cardTitle:    { fontSize: 22, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  cardSub:      { fontSize: 14, color: "#64748B", marginBottom: 20 },
  roleCard:     { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFF", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: "#E0E7FF" },
  roleCardOwner:{ backgroundColor: "#FAF5FF", borderColor: "#E9D5FF" },
  roleIcon:     { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 14 },
  roleText:     { flex: 1 },
  roleTitle:    { fontSize: 16, fontWeight: "700", color: "#1E3A8A", marginBottom: 3 },
  roleDesc:     { fontSize: 13, color: "#64748B" },
  roleArrow:    { width: 32, height: 32, borderRadius: 8, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  section:      { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A", marginBottom: 14 },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  featureBox:   { width: GRID_COL, backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "flex-start", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  featureIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  featureLabel: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  statsBar:     { flexDirection: "row", backgroundColor: "#1D4ED8", marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 24, justifyContent: "space-around" },
  statItem:     { alignItems: "center" },
  statVal:      { fontSize: 18, fontWeight: "800", color: "#fff" },
  statLbl:      { fontSize: 11, color: "#93C5FD", marginTop: 2 },
  footer:       { paddingVertical: 24, alignItems: "center" },
  footerText:   { fontSize: 12, color: "#94A3B8" },
});
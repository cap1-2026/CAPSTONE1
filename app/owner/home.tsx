import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OwnerHome() {
  const router = useRouter();

  const features = [
    { icon: "credit-card-outline", title: "Automated Rent Collection", text: "Secure, hassle-free monthly rent collection with automatic payment processing.", color: "#2563EB" },
    { icon: "key-outline", title: "No Manual Key Handling", text: "IoT-enabled smart key system for seamless tenant access management.", color: "#7C3AED" },
    { icon: "file-document-outline", title: "Digital Contracts", text: "E-signature enabled contracts that are legally binding and easy to manage.", color: "#0891B2" },
    { icon: "shield-check", title: "Secure Payments", text: "All transactions protected with escrow handling and secure payment gateways.", color: "#059669" },
  ];

  const propertyTypes = [
    { key: "apartment", title: "Apartment", icon: "office-building", color: "#EFF6FF", iconColor: "#2563EB" },
    { key: "condo", title: "Condominium", icon: "home-city", color: "#F5F3FF", iconColor: "#7C3AED" },
    { key: "dorm", title: "Dormitory", icon: "bed-king-outline", color: "#FFF7ED", iconColor: "#EA580C" },
    { key: "transient", title: "Transient", icon: "airplane", color: "#F0FDF4", iconColor: "#059669" },
  ];

  const steps = [
    { idx: "01", title: "Register & Submit Property", text: "Create an account and submit property details, amenities, and ownership documents." },
    { idx: "02", title: "Automated Review & Approval", text: "Admin validates submissions within 2–3 business days." },
    { idx: "03", title: "Smart Listing Goes Live", text: "Approved properties become searchable and visible to tenants." },
    { idx: "04", title: "Digital Contract & Booking", text: "System generates a digital rental agreement for both parties." },
    { idx: "05", title: "Secure Escrow & Payment", text: "Payments held in escrow and released per contract terms." },
    { idx: "06", title: "IoT Key Activation", text: "After payment, a time-limited digital key is activated for the tenant." },
    { idx: "07", title: "Automated Management", text: "Payments, reminders, and access logs are automated in-dashboard." },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

      {/* Hero Banner */}
      <View style={styles.hero}>
        <View style={styles.heroCircle} />
        <View style={styles.heroCircle2} />
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Ionicons name="star" size={13} color="#FCD34D" />
            <Text style={styles.heroBadgeText}>Trusted by 300+ property owners</Text>
          </View>
          <Text style={styles.heroTitle}>Let Us Manage{"\n"}Your Property</Text>
          <Text style={styles.heroSub}>Professional management with automated rent collection, smart key systems, and secure digital contracts.</Text>
          <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/owner/submit-property')}>
            <Text style={styles.heroBtnText}>List Your Property</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {[
          { icon: "view-dashboard-outline", label: "Dashboard", path: "/owner/dashboard", color: "#EFF6FF", iconColor: "#2563EB" },
          { icon: "home-city-outline", label: "Properties", path: "/owner/properties", color: "#F5F3FF", iconColor: "#7C3AED" },
          { icon: "account-group-outline", label: "Tenants", path: "/owner/tenants", color: "#FFF7ED", iconColor: "#EA580C" },
          { icon: "chart-bar", label: "Financials", path: "/owner/financials", color: "#F0FDF4", iconColor: "#059669" },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.quickCard} onPress={() => router.push(item.path as any)}>
            <View style={[styles.quickIcon, { backgroundColor: item.color }]}>
              <MaterialCommunityIcons name={item.icon as any} size={22} color={item.iconColor} />
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Why Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose PropertyPro?</Text>
        <Text style={styles.sectionSub}>Everything you need to manage properties effortlessly</Text>
        {features.map((f, i) => (
          <View key={i} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: f.color + "15" }]}>
              <MaterialCommunityIcons name={f.icon as any} size={24} color={f.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.sectionSub}>A secure, automated workflow from listing to move-in</Text>
        {steps.map((s, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={styles.stepCircle}><Text style={styles.stepNum}>{s.idx}</Text></View>
              {i < steps.length - 1 && <View style={styles.stepLine} />}
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Property Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Property Types We Accept</Text>
        <View style={styles.typesGrid}>
          {propertyTypes.map((t) => (
            <View key={t.key} style={styles.typeCard}>
              <View style={[styles.typeIcon, { backgroundColor: t.color }]}>
                <MaterialCommunityIcons name={t.icon as any} size={28} color={t.iconColor} />
              </View>
              <Text style={styles.typeTitle}>{t.title}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaCard} onPress={() => router.push('/owner/submit-property')}>
        <View>
          <Text style={styles.ctaTitle}>Ready to get started?</Text>
          <Text style={styles.ctaSub}>List your first property today — it's free.</Text>
        </View>
        <View style={styles.ctaBtn}>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#2563EB" />
        </View>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F8FAFC", paddingBottom: 32 },

  hero: { backgroundColor: "#1D4ED8", paddingTop: 32, paddingBottom: 40, paddingHorizontal: 24, overflow: "hidden", position: "relative" },
  heroCircle: { position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.07)" },
  heroCircle2: { position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)" },
  heroContent: { zIndex: 1 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 14 },
  heroBadgeText: { fontSize: 12, color: "#fff", fontWeight: "500" },
  heroTitle: { fontSize: 30, fontWeight: "800", color: "#fff", lineHeight: 38, marginBottom: 10, letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: "#BFDBFE", lineHeight: 22, marginBottom: 20 },
  heroBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, alignSelf: "flex-start" },
  heroBtnText: { color: "#2563EB", fontWeight: "700", fontSize: 15 },

  quickActions: { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 16, gap: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  quickCard: { flex: 1, alignItems: "center", gap: 6 },
  quickIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center" },

  section: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  sectionSub: { fontSize: 14, color: "#64748B", marginBottom: 16 },

  featureCard: { flexDirection: "row", gap: 14, backgroundColor: "#fff", padding: 14, borderRadius: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  featureIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 14, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  featureText: { fontSize: 13, color: "#64748B", lineHeight: 19 },

  stepRow: { flexDirection: "row", gap: 14, marginBottom: 0 },
  stepLeft: { alignItems: "center", width: 36 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  stepNum: { color: "#fff", fontWeight: "700", fontSize: 12 },
  stepLine: { width: 2, flex: 1, backgroundColor: "#BFDBFE", marginVertical: 4 },
  stepBody: { flex: 1, paddingBottom: 18 },
  stepTitle: { fontSize: 14, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  stepText: { fontSize: 13, color: "#64748B", lineHeight: 19 },

  typesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: { width: "47%", backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", gap: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  typeIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  typeTitle: { fontSize: 14, fontWeight: "700", color: "#1E293B" },

  ctaCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1D4ED8", marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20 },
  ctaTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  ctaSub: { fontSize: 13, color: "#BFDBFE" },
  ctaBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
});
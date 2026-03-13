import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TenantHome() {
  const router = useRouter();

  const propertyTypes = [
    { name: "Apartments", count: "150+", icon: "office-building", color: "#EFF6FF", iconColor: "#2563EB" },
    { name: "Condominiums", count: "89+", icon: "home-city", color: "#F5F3FF", iconColor: "#7C3AED" },
    { name: "Dormitories", count: "45+", icon: "bed-king-outline", color: "#FFF7ED", iconColor: "#EA580C" },
    { name: "Transient", count: "32+", icon: "airplane", color: "#F0FDF4", iconColor: "#059669" },
  ];

  const steps = [
    { num: "1", title: "Search", desc: "Browse verified properties with advanced filters", color: "#2563EB" },
    { num: "2", title: "Book", desc: "Book online and pay securely with escrow protection", color: "#7C3AED" },
    { num: "3", title: "Sign", desc: "Sign digital contract with legally binding e-signature", color: "#0891B2" },
    { num: "4", title: "Move In", desc: "Get IoT key instantly and move in hassle-free", color: "#059669" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroDecor} />
        <View style={styles.heroBadge}>
          <Ionicons name="home" size={13} color="#93C5FD" />
          <Text style={styles.heroBadgeText}>500+ verified properties</Text>
        </View>
        <Text style={styles.heroTitle}>Find Your Perfect{"\n"}Place to Live</Text>
        <Text style={styles.heroSub}>Browse apartments, condos, dorms & transient rentals. Book online with secure digital contracts.</Text>
        <TouchableOpacity style={styles.heroBtn} onPress={() => router.push("/tenant/browse-properties")}>
          <Ionicons name="search" size={16} color="#2563EB" />
          <Text style={styles.heroBtnText}>Browse Properties</Text>
        </TouchableOpacity>
      </View>

      {/* My Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Account</Text>
        <Text style={styles.sectionSub}>Manage your rentals, payments & contracts</Text>
        <View style={styles.dashGrid}>
          {[
            { icon: "view-dashboard-outline", label: "Dashboard", sub: "Overview & stats", path: "/tenant/dashboard", color: "#EFF6FF", iconColor: "#2563EB" },
            { icon: "home-city-outline", label: "My Properties", sub: "Active rentals", path: "/tenant/properties", color: "#F5F3FF", iconColor: "#7C3AED" },
            { icon: "credit-card-outline", label: "Payments", sub: "Pay rent online", path: "/tenant/payment", color: "#FFF7ED", iconColor: "#EA580C" },
            { icon: "file-document-outline", label: "Contracts", sub: "Lease agreements", path: "/tenant/contracts", color: "#F0FDF4", iconColor: "#059669" },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.dashCard} onPress={() => router.push(item.path as any)}>
              <View style={[styles.dashIcon, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={item.iconColor} />
              </View>
              <Text style={styles.dashLabel}>{item.label}</Text>
              <Text style={styles.dashSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Browse by Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Type</Text>
        <View style={styles.typesGrid}>
          {propertyTypes.map((t, i) => (
            <TouchableOpacity
              key={i}
              style={styles.typeCard}
              onPress={() => router.push(`/tenant/browse-properties?type=${t.name.slice(0, -1)}` as any)}
            >
              <View style={[styles.typeIcon, { backgroundColor: t.color }]}>
                <MaterialCommunityIcons name={t.icon as any} size={26} color={t.iconColor} />
              </View>
              <Text style={styles.typeName}>{t.name}</Text>
              <Text style={styles.typeCount}>{t.count} listings</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Why PadFinder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose PadFinder?</Text>
        <View style={styles.benefitsRow}>
          {[
            { icon: "shield-checkmark", color: "#059669", bg: "#F0FDF4", label: "Verified Listings" },
            { icon: "lock-closed", color: "#2563EB", bg: "#EFF6FF", label: "Secure Payments" },
            { icon: "document-text", color: "#7C3AED", bg: "#F5F3FF", label: "Digital Contracts" },
            { icon: "key", color: "#EA580C", bg: "#FFF7ED", label: "IoT Key Access" },
          ].map((b, i) => (
            <View key={i} style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: b.bg }]}>
                <Ionicons name={b.icon as any} size={20} color={b.color} />
              </View>
              <Text style={styles.benefitLabel}>{b.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.sectionSub}>4 simple steps to your new home</Text>
        {steps.map((s, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.stepCircle, { backgroundColor: s.color }]}>
              <Text style={styles.stepNum}>{s.num}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepText}>{s.desc}</Text>
            </View>
            {i < steps.length - 1 && <View style={styles.stepArrow}><Ionicons name="chevron-forward" size={16} color="#CBD5E1" /></View>}
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaCard} onPress={() => router.push("/tenant/browse-properties")}>
        <View>
          <Text style={styles.ctaTitle}>Ready to find your home?</Text>
          <Text style={styles.ctaSub}>Browse 500+ verified properties now.</Text>
        </View>
        <View style={styles.ctaArrow}>
          <Ionicons name="arrow-forward" size={20} color="#2563EB" />
        </View>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F8FAFC", paddingBottom: 32 },

  hero: { backgroundColor: "#1D4ED8", paddingTop: 28, paddingBottom: 36, paddingHorizontal: 24, overflow: "hidden", position: "relative" },
  heroDecor: { position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.07)" },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.14)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  heroBadgeText: { fontSize: 12, color: "#fff", fontWeight: "500" },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff", lineHeight: 36, marginBottom: 10, letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: "#BFDBFE", lineHeight: 21, marginBottom: 18 },
  heroBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, alignSelf: "flex-start" },
  heroBtnText: { color: "#2563EB", fontWeight: "700", fontSize: 14 },

  section: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  sectionSub: { fontSize: 14, color: "#64748B", marginBottom: 14 },

  dashGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  dashCard: { width: "47%", backgroundColor: "#fff", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  dashIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  dashLabel: { fontSize: 14, fontWeight: "700", color: "#1E293B", marginBottom: 3 },
  dashSub: { fontSize: 12, color: "#64748B" },

  typesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  typeCard: { width: "47%", backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", gap: 6, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  typeIcon: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  typeName: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  typeCount: { fontSize: 12, color: "#64748B" },

  benefitsRow: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 14, padding: 16, justifyContent: "space-around", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, marginTop: 8 },
  benefitItem: { alignItems: "center", gap: 6 },
  benefitIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  benefitLabel: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center", maxWidth: 64 },

  stepRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  stepNum: { color: "#fff", fontWeight: "800", fontSize: 14 },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: "700", color: "#1E293B", marginBottom: 3 },
  stepText: { fontSize: 12, color: "#64748B", lineHeight: 18 },
  stepArrow: {},

  ctaCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1D4ED8", marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20 },
  ctaTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  ctaSub: { fontSize: 13, color: "#BFDBFE" },
  ctaArrow: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
});
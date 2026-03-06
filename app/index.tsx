import React from "react";
import { Text, View, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const router = useRouter();

  function goToRole(role: string) {
    router.push({ pathname: "/login/[role]", params: { role } });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hero Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image source={require("../assets/images/padfinder-logo.png")} style={styles.logoImage} />
            <Text style={styles.logoText}>PadFinder</Text>
          </View>
          <Text style={styles.headerSubtitle}>Find Your Perfect Space</Text>
          <Text style={styles.tagline}>Your trusted rental platform</Text>
        </View>
        <View style={styles.waveContainer}>
          <View style={styles.wave} />
        </View>
      </View>

      {/* Role Selection Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.selectTitle}>Select Your Role</Text>
          <Text style={styles.selectSubtitle}>Choose how you want to get started</Text>
        </View>

        {/* Tenant Button */}
        <TouchableOpacity 
          style={styles.roleCard} 
          onPress={() => goToRole("tenant")}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#E3F2FD" }]}>
            <Ionicons name="search" size={32} color="#007AFF" />
          </View>
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Tenant</Text>
            <Text style={styles.roleDescription}>
              Find and rent your perfect property
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        {/* Owner Button */}
        <TouchableOpacity 
          style={styles.roleCard} 
          onPress={() => goToRole("owner")}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#E8EAF6" }]}>
            <Ionicons name="key" size={32} color="#1565D8" />
          </View>
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Property Owner</Text>
            <Text style={styles.roleDescription}>
              List and manage your properties
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <View style={styles.featureItem}>
          <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>Secure Transactions</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="checkmark-done" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>Verified Properties</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="flash" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>Instant Booking</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 PadFinder. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#f5f7fa" },
  header: { backgroundColor: "#007AFF", paddingTop: 80, paddingBottom: 100, paddingHorizontal: 20, position: "relative" },
  headerContent: { alignItems: "center", zIndex: 1 },
  logoContainer: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  logoImage: { width: 80, height: 80, resizeMode: "contain" },
  logoText: { fontSize: 42, fontWeight: "800", color: "#fff" },
  headerSubtitle: { fontSize: 18, color: "#fff", opacity: 0.95, marginBottom: 4 },
  tagline: { fontSize: 14, color: "#fff", opacity: 0.8 },
  waveContainer: { position: "absolute", bottom: -1, left: 0, right: 0, height: 30, overflow: "hidden" },
  wave: { position: "absolute", bottom: -10, left: 0, right: 0, height: 40, backgroundColor: "#f5f7fa", borderTopLeftRadius: 50, borderTopRightRadius: 50 },
  card: { backgroundColor: "#fff", marginHorizontal: 20, marginTop: 0, borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, elevation: 8, marginBottom: 24 },
  cardHeader: { marginBottom: 24, alignItems: "center" },
  selectTitle: { fontSize: 26, fontWeight: "700", color: "#333", marginBottom: 6 },
  selectSubtitle: { fontSize: 14, color: "#666" },
  roleCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9f9f9", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: "transparent" },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginRight: 16 },
  roleContent: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 4 },
  roleDescription: { fontSize: 13, color: "#666", lineHeight: 18 },
  featuresSection: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 20, marginBottom: 30 },
  featureItem: { alignItems: "center", gap: 8 },
  featureText: { fontSize: 12, color: "#666", fontWeight: "500" },
  footer: { paddingVertical: 30, alignItems: "center" },
  footerText: { fontSize: 12, color: "#999" },
});

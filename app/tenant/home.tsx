import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function TenantHome() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("Property Type");

  const propertyTypes = [
    { name: "Apartments", count: "150 listings", icon: "🏢" },
    { name: "Condominiums", count: "89 listings", icon: "🏙️" },
    { name: "Dormitories", count: "45 listings", icon: "🏠" },
    { name: "Transient", count: "32 listings", icon: "🏖️" },
  ];

  const features = [
    { icon: "🔒", title: "Secure Payments", desc: "SSL encrypted transactions" },
    { icon: "✓", title: "Verified Listings", desc: "All properties verified" },
    { icon: "📄", title: "Digital Contracts", desc: "Legally binding e-signatures" },
    { icon: "🔑", title: "IoT Key Access", desc: "Instant digital keys" },
  ];

  const steps = [
    { number: "1", title: "Search", desc: "Browse verified properties with advanced filters" },
    { number: "2", title: "Book", desc: "Book online and pay securely with escrow" },
    { number: "3", title: "Sign", desc: "Sign digital contract with e-signature" },
    { number: "4", title: "Move In", desc: "Get IoT key and move in hassle-free" },
  ];

  const benefits = [
    { icon: "🔍", title: "Easy Search", desc: "Find your perfect home with powerful filters for location, price, and amenities" },
    { icon: "💳", title: "Secure Payments", desc: "Pay rent and deposits online with encrypted, secure payment processing" },
    { icon: "🛡️", title: "Escrow Protection", desc: "Your security deposit is safely held in escrow until move-out" },
    { icon: "📝", title: "Digital Contracts", desc: "Sign your lease agreement online with legally binding e-signatures" },
    { icon: "🔑", title: "Smart Key Access", desc: "Get digital keys delivered instantly - no physical key exchange needed" },
    { icon: "✓", title: "Verified Listings", desc: "All properties are verified and managed by PropertyPro" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Find Your Perfect Home</Text>
        <Text style={styles.heroSubtitle}>
          Browse verified apartments, dorms, condos, and transient rentals. Book online and move in with digital keys.
        </Text>

        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => router.push("/tenant/browse-properties")}
        >
          <Text style={styles.browseButtonText}>Browse Properties</Text>
        </TouchableOpacity>

        <Text style={styles.heroFooter}>🏠 Over 500+ verified properties available now</Text>
      </View>

      {/* Features Bar */}
      <Text style={styles.header}>Why Choose PropertyPro?</Text>
      <Text style={styles.lead}>Everything you need for a seamless rental experience</Text>
      <View style={styles.featuresList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureText}>{feature.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Browse by Property Type */}
      <Text style={[styles.header, { marginTop: 18 }]}>Browse by Property Type</Text>
      <View style={styles.typesList}>
        {propertyTypes.map((type, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.typeCard}
            onPress={() => router.push(`/tenant/browse-properties?type=${type.name.slice(0, -1)}`)}
          >
            <Text style={styles.propertyIcon}>{type.icon}</Text>
            <Text style={styles.typeTitle}>{type.name}</Text>
            <Text style={styles.typeText}>{type.count}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* How It Works */}
      <Text style={[styles.header, { marginTop: 18 }]}>How It Works</Text>
      <Text style={styles.lead}>4 simple steps to your new home</Text>
      <View style={styles.stepsRow}>
        {steps.map((step, index) => (
          <View key={index} style={styles.step}>
            <View style={styles.stepRow}>
              <View style={styles.stepIndexCircle}>
                <Text style={styles.stepIndexText}>{step.number}</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepText}>{step.desc}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Benefits */}
      <Text style={[styles.header, { marginTop: 18 }]}>Key Benefits</Text>
      <View style={styles.benefitsList}>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>{benefit.icon}</Text>
            <Text style={styles.benefitTitle}>{benefit.title}</Text>
            <Text style={styles.benefitText}>{benefit.desc}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 24, fontWeight: "600", marginBottom: 16 },
  lead: { fontSize: 16, color: '#444', marginBottom: 12 },
  hero: { backgroundColor: '#1565D8', padding: 24, borderRadius: 12, marginBottom: 18 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '700', marginBottom: 8 },
  heroSubtitle: { color: '#E8F0FF', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  browseButton: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start' },
  browseButtonText: { color: '#0A58FF', fontWeight: '700' },
  heroFooter: { marginTop: 14, color: '#E8F0FF', fontSize: 13 },
  featuresList: { marginTop: 6 },
  featureCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 12, elevation: 2, marginBottom: 12, alignItems: 'center' },
  featureIcon: { fontSize: 28, marginRight: 12 },
  featureContent: { flex: 1 },
  featureTitle: { fontWeight: '700', marginBottom: 6 },
  featureText: { color: '#666', fontSize: 13, lineHeight: 20 },
  typesList: { marginTop: 12 },
  typeCard: { backgroundColor: '#fff', paddingVertical: 24, paddingHorizontal: 18, borderRadius: 12, elevation: 2, marginBottom: 12, alignItems: 'center' },
  propertyIcon: { fontSize: 44, marginBottom: 8 },
  typeTitle: { fontWeight: '700', marginBottom: 6 },
  typeText: { color: '#666', textAlign: 'center', lineHeight: 20 },
  stepsRow: { marginTop: 8 },
  step: { backgroundColor: 'transparent', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', width: '92%' },
  stepIndexCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepIndexText: { color: '#fff', fontWeight: '700' },
  stepBody: { flex: 1 },
  stepTitle: { fontWeight: '700', marginBottom: 6 },
  stepText: { color: '#666' },
  benefitsList: { marginTop: 12 },
  benefitCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 12, alignItems: 'center' },
  benefitIcon: { fontSize: 32, marginBottom: 8 },
  benefitTitle: { fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  benefitText: { color: '#666', fontSize: 13, lineHeight: 20, textAlign: 'center' },
});

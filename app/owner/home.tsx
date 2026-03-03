import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";

export default function OwnerHome() {
  const router = useRouter();

  function go(path: string) {
    router.push(path as any);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Let Us Manage Your Property</Text>
        <Text style={styles.heroSubtitle}>Professional property management with automated rent collection, smart key systems, and secure digital contracts. Focus on growing your portfolio while we handle the rest.</Text>
        <TouchableOpacity style={styles.heroButton} onPress={() => go('/owner/submit-property')}>
          <Text style={styles.heroButtonText}>List Your Property With Us</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#0A58FF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>

      <Text style={styles.header}>Why Choose PropertyPro?</Text>
      <Text style={styles.lead}>Everything you need to manage properties effortlessly</Text>

      <View style={styles.featuresList}>
        {[
          { key: 'rent', title: 'Automated Rent Collection', text: 'Secure, hassle-free monthly rent collection with automatic payment processing.', icon: 'credit-card-outline' },
          { key: 'key', title: 'No Manual Key Handling', text: 'IoT-enabled smart key system for seamless tenant access management.', icon: 'key-outline' },
          { key: 'contracts', title: 'Digital Contracts', text: 'E-signature enabled contracts that are legally binding and easy to manage.', icon: 'file-document-outline' },
          { key: 'payments', title: 'Secure Payments', text: 'All transactions protected with escrow handling and secure payment gateways.', icon: 'shield-check' },
        ].map((f) => (
          <View key={f.key} style={styles.featureCard}>
            <MaterialCommunityIcons name={f.icon as any} size={28} color="#007AFF" style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.header, { marginTop: 18 }]}>How It Works</Text>
      <Text style={styles.lead}>A secure, automated workflow from listing to move-in</Text>
      <View style={styles.stepsRow}>
        {[
          {
              idx: '01',
              title: 'Register & Submit Property Details',
              text: 'Create an account and submit property details, amenities, pricing, and ownership documents.'
            },
            {
              idx: '02',
              title: 'Automated Review & Approval',
              text: 'Automated checks validate submissions; status is Approved or Requires Revision within 2–3 business days.'
            },
            {
              idx: '03',
              title: 'Smart Listing Goes Live',
              text: 'Approved properties become searchable; tenants filter and compare listings with photos and details.'
            },
            {
              idx: '04',
              title: 'Digital Contract & Online Booking',
              text: 'System generates a digital rental agreement; both parties review and sign electronically.'
            },
            {
              idx: '05',
              title: 'Secure Escrow & Automated Payment',
              text: 'Payments held in escrow and released per contract; confirmations are sent automatically.'
            },
            {
              idx: '06',
              title: 'IoT-Based Digital Access Activation',
              text: 'After payment, a temporary digital key is activated with time-limited access.'
            },
            {
              idx: '07',
              title: 'Automated Rental Management & Income Monitoring',
              text: 'Payments, reminders, and access logs are automated; owners monitor income in-dashboard.'
            }
        ].map((s) => (
          <View key={s.idx} style={styles.step}>
            <View style={styles.stepRow}>
              <View style={styles.stepIndexCircle}><Text style={styles.stepIndexText}>{s.idx}</Text></View>
              <View style={styles.stepBody}><Text style={styles.stepTitle}>{s.title}</Text><Text style={styles.stepText}>{s.text}</Text></View>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.header, { marginTop: 18 }]}>Property Types We Accept</Text>
      <View style={styles.typesList}>
        {[
          { key: 'apartment', title: 'Apartment', text: 'Multi-unit residential buildings with individual leasing options.', icon: 'office-building' },
          { key: 'condo', title: 'Condominium', text: 'Modern condo units with shared amenities and facilities.', icon: 'home-city' },
          { key: 'dorm', title: 'Dormitory', text: 'Student or worker housing with room-by-room management.', icon: 'bed-king-outline' },
          { key: 'transient', title: 'Transient Rental', text: 'Short-term rentals for travelers and temporary stays.', icon: 'airplane' },
        ].map((t) => (
          <View key={t.key} style={styles.typeCard}>
            <MaterialCommunityIcons name={t.icon as any} size={44} color="#007AFF" style={{ marginBottom: 12 }} />
            <Text style={styles.typeTitle}>{t.title}</Text>
            <Text style={styles.typeText}>{t.text}</Text>
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
    heroButton: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
    heroButtonText: { color: '#0A58FF', fontWeight: '700' },
    featuresList: { marginTop: 6 },
    featureCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 12, elevation: 2, marginBottom: 12, alignItems: 'flex-start' },
    featureIcon: { marginRight: 12, marginTop: 2 },
    featureContent: { flex: 1 },
    featureTitle: { fontWeight: '700', marginBottom: 6 },
    featureText: { color: '#666', fontSize: 13, lineHeight: 20 },
    stepsRow: { marginTop: 8 },
    step: { backgroundColor: 'transparent', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', width: '92%' },
    stepIndexCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    stepIndexText: { color: '#fff', fontWeight: '700' },
    stepBody: { flex: 1 },
    stepTitle: { fontWeight: '700', marginBottom: 6 },
    stepText: { color: '#666' },
    typesRow: { flexDirection: 'row', justifyContent: 'space-between' },
    typesList: { marginTop: 12 },
    typeCard: { backgroundColor: '#fff', paddingVertical: 24, paddingHorizontal: 18, borderRadius: 12, elevation: 2, marginBottom: 12, alignItems: 'center' },
    typeIcon: { width: 48, height: 48, borderRadius: 10, borderWidth: 2, borderColor: '#007AFF', marginBottom: 12 },
    typeTitle: { fontWeight: '700', marginBottom: 6 },
    typeText: { color: '#666', textAlign: 'center', lineHeight: 20 },
  cardsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  card: { flex: 1, backgroundColor: "#fff", padding: 14, marginRight: 8, borderRadius: 8, elevation: 2 },
  fullWidthCard: { backgroundColor: "#fff", padding: 14, borderRadius: 8, elevation: 2, marginTop: 12 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardSubtitle: { fontSize: 12, color: "#666", marginTop: 6 },
});

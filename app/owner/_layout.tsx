import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Slot, useRouter, useSegments } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OwnerLayout() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  function go(path: string) {
    setOpen(false);
    router.push(path as any);
  }

  function handleLogout() {
    setOpen(false);
    router.replace('/');
  }

  const lastSegment = segments[segments.length - 1];
  const showBack = !!lastSegment && lastSegment !== "home";
  const showMenu = lastSegment === "home";

  const menuItems = [
    { icon: "view-dashboard-outline", label: "Dashboard", path: "/owner/dashboard", color: "#2563EB" },
    { icon: "home-city-outline", label: "My Listed Properties", path: "/owner/properties", color: "#7C3AED" },
    { icon: "account-group-outline", label: "Tenants", path: "/owner/tenants", color: "#EA580C" },
    { icon: "calendar-check-outline", label: "Booking Requests", path: "/owner/bookings", color: "#0891B2" },
    { icon: "chart-bar", label: "Occupancy Status", path: "/owner/occupancy", color: "#059669" },
    { icon: "file-document-outline", label: "Contracts", path: "/owner/contracts", color: "#8B5CF6" },
    { icon: "cash-multiple", label: "Financials", path: "/owner/financials", color: "#D97706" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {showBack ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color="#374151" />
            </TouchableOpacity>
          ) : null}
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="home" size={16} color="#fff" />
            </View>
            <Text style={styles.logoText}>PadFinder</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => go('/owner/notifications')} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#374151" />
          </TouchableOpacity>
          {showMenu ? (
            <TouchableOpacity onPress={() => setOpen(true)} style={styles.hamburger}>
              <View style={styles.bar} />
              <View style={styles.bar} />
              <View style={[styles.bar, { width: 14 }]} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Slot />

      {/* Drawer */}
      <Modal visible={open} animationType="fade" transparent>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.drawer}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerLogo}>
                <Ionicons name="home" size={22} color="#fff" />
              </View>
              <View>
                <Text style={styles.drawerTitle}>PadFinder</Text>
                <Text style={styles.drawerRole}>Property Owner</Text>
              </View>
              <TouchableOpacity style={styles.drawerClose} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.drawerSectionLabel}>NAVIGATION</Text>
              {menuItems.map((item, i) => (
                <TouchableOpacity key={i} style={styles.menuItem} onPress={() => go(item.path)}>
                  <View style={[styles.menuItemIcon, { backgroundColor: item.color + "15" }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>
              ))}

              <View style={styles.drawerDivider} />

              <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
                <View style={[styles.menuItemIcon, { backgroundColor: "#FEE2E2" }]}>
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                </View>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 58, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logoIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  hamburger: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', gap: 3 },
  bar: { width: 18, height: 2, backgroundColor: '#374151', borderRadius: 1 },

  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', flexDirection: 'row', justifyContent: 'flex-end' },
  drawer: { width: '80%', height: '100%', backgroundColor: '#fff' },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: '#FAFBFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  drawerLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  drawerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  drawerRole: { fontSize: 12, color: '#64748B', marginTop: 1 },
  drawerClose: { marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  drawerBody: { flex: 1, paddingHorizontal: 16 },
  drawerSectionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginTop: 20, marginBottom: 8, paddingHorizontal: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 2, paddingHorizontal: 4 },
  menuItemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  drawerDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  logoutItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderRadius: 10, paddingHorizontal: 4, marginBottom: 24 },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
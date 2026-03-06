import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Slot, Stack, useRouter, useSegments } from "expo-router";
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

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {showBack ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.brand}>List your property with us</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => go('/owner/notifications')} style={styles.notificationBtn}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#333" />
          </TouchableOpacity>
          {showMenu ? (
            <TouchableOpacity onPress={() => setOpen(true)} style={styles.hamburger}>
              <View style={styles.bar} />
              <View style={styles.bar} />
              <View style={styles.bar} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Stack screenOptions={{ headerShown: false }}>
        <Slot />
      </Stack>

      <Modal visible={open} animationType="none" transparent>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sideFull} onPress={() => { /* capture touches */ }}>
            <ScrollView>
              <Text style={styles.menuHeader}>Quick Actions</Text>
              <TouchableOpacity style={styles.menuItem} onPress={() => go('/owner/dashboard')}>
                <Text>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => go('/owner/properties')}>
                <Text>My Listed Properties</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => go('/owner/occupancy')}>
                <Text>Occupancy Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => go('/owner/contracts')}>
                <Text>Contract Copies</Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
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
  header: { height: 56, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, elevation: 2, justifyContent: 'space-between' },
  hamburger: { padding: 8 },
  bar: { width: 22, height: 2, backgroundColor: '#111', marginVertical: 2 },
  brand: { fontSize: 18, fontWeight: '600' },
  backBtn: { padding: 8, marginRight: 8 },
  notificationBtn: { padding: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', flexDirection: 'row', justifyContent: 'flex-end' },
  sideFull: { width: '82%', height: '100%', backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  menuHeader: { fontWeight: '700', marginBottom: 12 },
  menuItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 12 },
  logoutItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  logoutText: { fontSize: 16, color: '#DC2626', fontWeight: '600' },
});

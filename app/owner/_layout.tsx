import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView } from "react-native";
import { Slot, useRouter, Stack, useSegments } from "expo-router";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function OwnerLayout() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  function go(path: string) {
    setOpen(false);
    router.push(path as any);
  }

  const lastSegment = segments[segments.length - 1];
  const showBack = !!lastSegment && lastSegment !== "home";
  const showMenu = lastSegment === "home";

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {showBack ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.brand}>PropertyPro</Text>
        </View>
        {showMenu ? (
          <TouchableOpacity onPress={() => setOpen(true)} style={styles.hamburger}>
            <View style={styles.bar} />
            <View style={styles.bar} />
            <View style={styles.bar} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Stack screenOptions={{ headerShown: false }}>
        <Slot />
      </Stack>

      <Modal visible={open} animationType="none" transparent>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sideFull} onPress={() => { /* capture touches */ }}>
            <ScrollView>
              <Text style={styles.menuHeader}>Quick Actions</Text>
              <TouchableOpacity style={styles.menuItem} onPress={() => go('/owner/properties')}>
                <Text>My Listed Properties</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => go('/owner/occupancy')}>
                <Text>Occupancy Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => go('/owner/contracts')}>
                <Text>Contract Copies</Text>
              </TouchableOpacity>
              {/* 'Apply' route removed; menu item intentionally omitted */}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, elevation: 2, justifyContent: 'space-between' },
  hamburger: { padding: 8, marginLeft: 12 },
  bar: { width: 22, height: 2, backgroundColor: '#111', marginVertical: 2 },
  brand: { fontSize: 18, fontWeight: '600' },
  backBtn: { padding: 8, marginRight: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', flexDirection: 'row', justifyContent: 'flex-end' },
  sideFull: { width: '82%', height: '100%', backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  menuHeader: { fontWeight: '700', marginBottom: 12 },
  menuItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});

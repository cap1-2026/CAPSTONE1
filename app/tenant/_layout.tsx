import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Slot, useRouter, useSegments } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TenantLayout() {
  const router = useRouter();
  const segments = useSegments();

  const lastSegment = segments[segments.length - 1];
  const isHome = lastSegment === "home";

  return (
    <View style={{ flex: 1 }}>
      {/* Single shared header for all tenant screens */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
          {!isHome ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#333" />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.brand}>PropertyPro</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity onPress={() => router.push("/tenant/dashboard")} style={styles.iconBtn}>
            <MaterialCommunityIcons name="view-dashboard-outline" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/tenant/approvals")} style={styles.iconBtn}>
            <MaterialCommunityIcons name="clock-check-outline" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/tenant/notifications")} style={styles.iconBtn}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  brand: { fontSize: 18, fontWeight: '700', color: '#333' },
  backBtn: { padding: 8, marginRight: 4 },
  iconBtn: { padding: 8 },
});

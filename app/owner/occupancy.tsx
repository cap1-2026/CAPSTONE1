import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

const UNITS = [
  { unit: "101", tenant: "Juan D.", moveIn: "2024-11-01", leaseEnd: "2025-11-01", status: "Active" },
  { unit: "102", tenant: "", moveIn: "", leaseEnd: "", status: "Vacant" },
  { unit: "103", tenant: "Ana P.", moveIn: "2025-01-15", leaseEnd: "2026-01-14", status: "Active" },
];

export default function Occupancy() {
  const total = UNITS.length;
  const occupied = UNITS.filter(u => u.status === "Active").length;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Occupancy Status</Text>
      <Text style={styles.summary}>{occupied}/{total} units occupied</Text>
      <View style={styles.progressBackground}><View style={[styles.progressFill,{width: `${(occupied/total)*100}%` }]} /></View>

      <FlatList
        data={UNITS}
        keyExtractor={(i)=>i.unit}
        renderItem={({item}) => (
          <View style={styles.row}>
            <Text style={styles.unit}>{item.unit}</Text>
            <Text style={styles.uinfo}>{item.tenant || "-"}</Text>
            <Text style={styles.uinfo}>{item.moveIn || "-"}</Text>
            <Text style={[styles.status, item.status === 'Active' ? {color:'green'} : {color:'red'}]}>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 20, marginBottom: 6 },
  summary: { fontSize: 14, marginBottom: 8 },
  progressBackground: { height: 12, backgroundColor: '#eee', borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: 12, backgroundColor: '#0a84ff' },
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  unit: { width: 60, fontWeight: '600' },
  uinfo: { flex: 1 },
  status: { width: 100, textAlign: 'right' },
});

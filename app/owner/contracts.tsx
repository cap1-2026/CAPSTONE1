import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const CONTRACTS = [
  { id: 'c1', tenant: 'Juan Dela Cruz', unit: '101', start: '2024-11-01', end: '2025-11-01', status: 'Active' },
  { id: 'c2', tenant: 'Ana Perez', unit: '103', start: '2025-01-15', end: '2026-01-14', status: 'Active' },
];

export default function Contracts() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Contracts</Text>
      <FlatList
        data={CONTRACTS}
        keyExtractor={i => i.id}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={{flex:1}}>
              <Text style={styles.title}>{item.tenant} • {item.unit}</Text>
              <Text style={styles.meta}>{item.start} → {item.end}</Text>
            </View>
            <TouchableOpacity style={styles.btn}><Text>View</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn}><Text>Download</Text></TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16 },
  header: { fontSize:20, marginBottom:10 },
  row: { flexDirection:'row', alignItems:'center', padding:10, backgroundColor:'#fff', borderRadius:8, marginBottom:8 },
  title: { fontWeight:'600' },
  meta: { color:'#666', fontSize:12 },
  btn: { padding:8, marginLeft:8 }
});

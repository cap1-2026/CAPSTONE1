import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";

const FEES = [
  { key: 'management', label: 'Management fee', value: '10% of monthly rent' },
  { key: 'hosting', label: 'Platform hosting', value: 'Included' },
  { key: 'screening', label: 'Tenant screening', value: 'Included' },
];

export default function Financials() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Financials & Fee Structure</Text>
      <FlatList
        data={FEES}
        keyExtractor={i=>i.key}
        renderItem={({item})=> (
          <View style={styles.row}><Text style={styles.label}>{item.label}</Text><Text>{item.value}</Text></View>
        )}
      />

      <View style={styles.card}>
        <Text style={{fontWeight:'600'}}>Example computation</Text>
        <Text>₱10,000 rent → 10% fee → ₱1,000 fee → ₱9,000 payout</Text>
      </View>

      <TouchableOpacity style={styles.btn}><Text>View payout history</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16 },
  header: { fontSize:20, marginBottom:12 },
  row: { paddingVertical:10, borderBottomWidth:1, borderColor:'#f0f0f0' },
  label: { fontWeight:'600' },
  card: { padding:12, backgroundColor:'#fff', borderRadius:8, marginTop:12 },
  btn: { marginTop:12, padding:10 }
});

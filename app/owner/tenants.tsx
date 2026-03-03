import React from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";

const TENANTS = [
  { id: 't1', name: 'Juan Dela Cruz', unit: '101', contact: '0917-123-4567', email: 'juan@example.com', status: 'Paid' },
  { id: 't2', name: 'Ana Perez', unit: '103', contact: '0917-654-3210', email: 'ana@example.com', status: 'Due' },
];

export default function Tenants() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tenants</Text>
      <FlatList
        data={TENANTS}
        keyExtractor={i=>i.id}
        renderItem={({item}) => (
          <View style={styles.card}>
            <Image source={{uri:'https://via.placeholder.com/60'}} style={styles.pic} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.unit} • {item.contact}</Text>
              <Text style={styles.meta}>{item.email}</Text>
            </View>
            <View style={styles.actions}>
              <Text style={{color: item.status==='Paid' ? 'green':'orange'}}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16 },
  header: { fontSize:20, marginBottom:10 },
  card: { flexDirection:'row', padding:10, backgroundColor:'#fff', borderRadius:8, marginBottom:10, alignItems:'center' },
  pic: { width:60, height:60, borderRadius:30, marginRight:10 },
  info: { flex:1 },
  name: { fontWeight:'600' },
  meta: { color:'#666', fontSize:12 },
  actions: { width:80, alignItems:'flex-end' },
});

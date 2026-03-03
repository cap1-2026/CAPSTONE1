import React from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const MOCK = [
  { id: "p1", name: "Sunrise Apartments", type: "Apartment", address: "123 Main St, City", price: 12000, units: 10, occupied: 8, status: "Active" },
  { id: "p2", name: "Maple Dorms", type: "Dormitory", address: "45 College Rd", price: 3500, units: 20, occupied: 15, status: "Occupied" },
];

export default function Properties() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Listed Properties</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/owner/submit-property')}>
          <Text style={{ color: '#fff' }}>Add Property</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={MOCK}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: "https://via.placeholder.com/80" }} style={styles.thumb} />
            <View style={styles.info}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.sub}>{item.type} • {item.address}</Text>
              <Text style={styles.price}>₱{item.price.toLocaleString()}</Text>
              <Text style={styles.status}>{item.status} • {item.occupied}/{item.units} occupied</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btn} onPress={() => router.push({ pathname: '/owner/submit-property', params: { id: item.id } })}>
                <Text>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => router.push({ pathname: '/owner/property/[id]', params: { id: item.id } })}
              >
                <Text>Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 20, marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { backgroundColor: '#007AFF', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  card: { flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10, alignItems: "center" },
  thumb: { width: 80, height: 80, borderRadius: 6, marginRight: 10, backgroundColor: "#eee" },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600" },
  sub: { color: "#666", fontSize: 12, marginTop: 4 },
  price: { marginTop: 6, fontWeight: "600" },
  status: { marginTop: 4, fontSize: 12, color: "#444" },
  actions: { justifyContent: "space-between" },
  btn: { padding: 8 },
});

import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

const MOCK = [
  { id: "p1", name: "Sunrise Apartments", type: "Apartment", address: "123 Main St, City", price: 12000, units: 10, occupied: 8, status: "Active", description: "Spacious apartments near downtown." },
  { id: "p2", name: "Maple Dorms", type: "Dormitory", address: "45 College Rd", price: 3500, units: 20, occupied: 15, status: "Occupied", description: "Affordable dorms for students." },
];

export default function PropertyDetails() {
  const params = useLocalSearchParams() as { id?: string };
  const router = useRouter();
  const prop = MOCK.find((p) => p.id === params.id);

  if (!prop) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Property not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}><Text>{'<'} Back</Text></TouchableOpacity>
      <Image source={{ uri: 'https://via.placeholder.com/300x150' }} style={styles.image} />
      <Text style={styles.title}>{prop.name}</Text>
      <Text style={styles.sub}>{prop.type} • {prop.address}</Text>
      <Text style={styles.price}>₱{prop.price.toLocaleString()}</Text>
      <Text style={styles.status}>{prop.status} • {prop.occupied}/{prop.units} occupied</Text>
      <Text style={styles.desc}>{prop.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  back: { marginBottom: 8 },
  image: { width: '100%', height: 150, borderRadius: 8, backgroundColor: '#eee' },
  title: { fontSize: 20, fontWeight: '600', marginTop: 12 },
  sub: { color: '#666', marginTop: 6 },
  price: { fontWeight: '600', marginTop: 8 },
  status: { marginTop: 6, color: '#444' },
  desc: { marginTop: 12, color: '#333' },
});

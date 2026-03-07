import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API_ENDPOINTS, { API_BASE_URL } from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

export default function Properties() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchProperties() {
    setLoading(true);
    try {
      const user = await UserStorage.getUser();
      const ownerId = user?.user_id ?? 1;
      const response = await fetch(`${API_ENDPOINTS.GET_PROPERTIES}?owner_id=${ownerId}`);
      const data = await response.json();
      if (data.status === "success") {
        setProperties(data.data);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProperty(id: number, name: string) {
    const confirmed = window.confirm(`Remove "${name}"?\n\nThis will permanently remove the listing. This cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_PROPERTY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: id }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setProperties(prev => prev.filter((p) => p.id !== id));
      } else {
        Alert.alert("Cannot Remove", data.message || "Failed to remove property.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to remove property. Check your connection.");
    }
  }

  // Reload every time the screen comes into focus (e.g. after submitting)
  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading properties...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/owner/home')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>My Listed Properties</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/owner/submit-property')}>
          <Text style={{ color: '#fff' }}>+ Add Property</Text>
        </TouchableOpacity>
      </View>

      {properties.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No properties yet.</Text>
          <Text style={styles.emptyHint}>Tap "+ Add Property" to list your first property.</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.first_image ? (
                <Image
                  source={{ uri: `${API_BASE_URL}/${item.first_image}` }}
                  style={styles.thumb}
                />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Text style={{ fontSize: 28 }}>🏢</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.sub}>{item.address}</Text>
                <Text style={styles.price}>₱{parseFloat(item.price).toLocaleString()} / month</Text>
                {item.amenities ? <Text style={styles.amenities}>{item.amenities}</Text> : null}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.btn} onPress={() => router.push({ pathname: '/owner/submit-property', params: { id: item.id } })}>
                  <Text style={styles.btnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => deleteProperty(item.id, item.name)}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#666" },
  header: { fontSize: 20, fontWeight: "700", color: "#333" },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f0f0f0', borderRadius: 8 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#333' },
  addBtn: { backgroundColor: '#007AFF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 8 },
  emptyHint: { fontSize: 14, color: "#888", textAlign: "center" },
  card: { flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 10, marginBottom: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  thumb: { width: 80, height: 80, borderRadius: 8, marginRight: 12, backgroundColor: "#eee" },
  thumbPlaceholder: { justifyContent: "center", alignItems: "center" },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: "#333" },
  sub: { color: "#666", fontSize: 12, marginTop: 4 },
  price: { marginTop: 6, fontWeight: "600", color: "#007AFF" },
  amenities: { marginTop: 4, fontSize: 11, color: "#888" },
  actions: { justifyContent: "center", gap: 8 },
  btn: { backgroundColor: "#f0f0f0", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  btnText: { fontSize: 13, color: "#333", fontWeight: "500" },
  removeBtn: { backgroundColor: "#fff0f0", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: "#ff3b30" },
  removeBtnText: { fontSize: 13, color: "#ff3b30", fontWeight: "500" },
});

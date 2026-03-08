import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API_ENDPOINTS, { API_BASE_URL } from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

export default function Properties() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function fetchProperties() {
    setLoading(true);
    setLoadError(null);
    try {
      const user = await UserStorage.getUser();
      const ownerId = user?.user_id ?? 1;
      const response = await fetch(`${API_ENDPOINTS.GET_PROPERTIES}?owner_id=${ownerId}`);
      const data = await response.json();
      if (data.status === "success") {
        setProperties(data.data ?? []);
      } else {
        setLoadError(data.message || "Failed to load properties.");
      }
    } catch (error) {
      setLoadError("Network error. Cannot reach server.");
    } finally {
      setLoading(false);
    }
  }

  function askDeleteProperty(id: number, name: string) {
    setDeleteError(null);
    setPendingDelete({ id: Number(id), name });
    setConfirmVisible(true);
  }

  function closeModal() {
    setConfirmVisible(false);
    setPendingDelete(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_PROPERTY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: pendingDelete.id }),
      });
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        setDeleteError("Server returned an unexpected response. Check that XAMPP is running.");
        setDeleting(false);
        return;
      }
      if (data.status === "success") {
        const deletedId = pendingDelete.id;
        setProperties(prev => prev.filter((p) => Number(p.id) !== deletedId));
        closeModal();
      } else {
        setDeleteError(data.message || "Failed to delete property.");
      }
    } catch (error) {
      setDeleteError("Network error. Cannot reach server — make sure XAMPP is running.");
    } finally {
      setDeleting(false);
    }
  }

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
      {/* Confirm Delete Modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Property</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{pendingDelete?.name}"?{"\n"}
              This will also remove all associated bookings and payments.
            </Text>

            {deleteError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{deleteError}</Text>
              </View>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={closeModal}
                disabled={deleting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteBtn, deleting && { opacity: 0.6 }]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/owner/home')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>My Listed Properties</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/owner/submit-property')}>
          <Text style={{ color: '#fff' }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loadError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{loadError}</Text>
          <TouchableOpacity onPress={fetchProperties} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {properties.length === 0 && !loadError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No properties yet.</Text>
          <Text style={styles.emptyHint}>Tap "+ Add" to list your first property.</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.first_image ? (
                <Image source={{ uri: API_BASE_URL + '/' + item.first_image }} style={styles.thumb} />
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
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => askDeleteProperty(item.id, item.name)}
                  activeOpacity={0.7}
                >
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
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", borderRadius: 14, padding: 24, width: 320, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 10 },
  modalMessage: { fontSize: 14, color: "#555", lineHeight: 20, marginBottom: 16 },
  errorBox: { backgroundColor: "#fff0f0", borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#ffcccc" },
  errorText: { color: "#cc0000", fontSize: 13, lineHeight: 18 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: "#f0f0f0" },
  modalCancelText: { fontSize: 14, color: "#333", fontWeight: "600" },
  modalDeleteBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: "#ff3b30", minWidth: 80, alignItems: "center" },
  modalDeleteText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  errorBanner: { backgroundColor: "#fff0f0", borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  errorBannerText: { color: "#cc0000", fontSize: 13, flex: 1 },
  retryBtn: { marginLeft: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#ff3b30", borderRadius: 6 },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});

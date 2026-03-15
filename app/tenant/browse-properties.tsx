import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator, Image, Modal, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import API_ENDPOINTS, { API_BASE_URL } from "../../config/api";

export default function BrowseProperties() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const propertyTypeParam = (params.type as string) || "All";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedPropertyType, setSelectedPropertyType] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState("All");
  const [selectedBedrooms, setSelectedBedrooms] = useState("All");
  const [selectedBathrooms, setSelectedBathrooms] = useState("All");
  const [amenityFilters, setAmenityFilters] = useState({
    wifi: false, ac: false, parking: false,
    furnished: false, security: false, elevator: false,
  });

  const propertyTypeOptions = ["All", "Apartment", "Condominium", "Dormitory", "Transient"];
  const priceRangeOptions = ["All", "Under ₱10,000", "₱10,000 - ₱20,000", "₱20,000 - ₱30,000", "Above ₱30,000"];
  const bedroomOptions = ["All", "Studio", "1", "2", "3", "4+"];
  const bathroomOptions = ["All", "1", "2", "3+"];

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [])
  );

  async function fetchProperties(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else { setLoading(true); setAllProperties([]); }
    setFetchError(null);

    try {
      // ✅ KEY FIX: only fetch approved properties for tenant browsing
      const url = `${API_ENDPOINTS.GET_PROPERTIES}?status=approved&_t=${Date.now()}`;
      const response = await fetch(url);
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        setFetchError(`Server error: ${text.slice(0, 200)}`);
        return;
      }
      if (data.status === "success") {
        // ✅ DOUBLE SAFETY: also filter client-side in case backend ignores the param
        const approvedOnly = (data.data ?? []).filter(
          (p: any) => (p.status || "").toLowerCase() === "approved"
        );
        setAllProperties(approvedOnly);
      } else {
        setFetchError(data.message || "Failed to load properties.");
      }
    } catch (error: any) {
      setFetchError(`Network error — make sure XAMPP is running. (${error?.message || error})`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredProperties = allProperties.filter((prop) => {
    const matchesSearch =
      (prop.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop.address || "").toLowerCase().includes(searchQuery.toLowerCase());

    const propType = (prop.property_type || "").trim().toLowerCase();
    const paramType = propertyTypeParam.toLowerCase();
    const matchesType = paramType === "all" || propType === "" || propType === paramType;

    const panelType = selectedPropertyType.toLowerCase();
    const matchesPropertyType = panelType === "all" || propType === "" || propType === panelType;

    let matchesPriceRange = true;
    const price = parseFloat(prop.price) || 0;
    if (selectedPriceRange === "Under ₱10,000") matchesPriceRange = price < 10000;
    else if (selectedPriceRange === "₱10,000 - ₱20,000") matchesPriceRange = price >= 10000 && price <= 20000;
    else if (selectedPriceRange === "₱20,000 - ₱30,000") matchesPriceRange = price >= 20000 && price <= 30000;
    else if (selectedPriceRange === "Above ₱30,000") matchesPriceRange = price > 30000;

    const rooms = parseInt(prop.rooms) || 0;
    const matchesBedrooms =
      selectedBedrooms === "All" ||
      (selectedBedrooms === "4+" ? rooms >= 4 : rooms.toString() === selectedBedrooms);

    const amenityStr = (prop.amenities || "").toLowerCase();
    let matchesAmenities = true;
    if (amenityFilters.wifi && !amenityStr.includes("wifi")) matchesAmenities = false;
    if (amenityFilters.ac && !amenityStr.includes("ac") && !amenityStr.includes("air con")) matchesAmenities = false;
    if (amenityFilters.parking && !amenityStr.includes("parking")) matchesAmenities = false;
    if (amenityFilters.furnished && !amenityStr.includes("furnished")) matchesAmenities = false;
    if (amenityFilters.security && !amenityStr.includes("security") && !amenityStr.includes("guard")) matchesAmenities = false;
    if (amenityFilters.elevator && !amenityStr.includes("elevator")) matchesAmenities = false;

    return matchesSearch && matchesType && matchesPropertyType &&
      matchesPriceRange && matchesBedrooms && matchesAmenities;
  });

  const hasActiveFilters =
    selectedPropertyType !== "All" || selectedPriceRange !== "All" ||
    selectedBedrooms !== "All" || selectedBathrooms !== "All" ||
    Object.values(amenityFilters).some((v) => v);

  function clearAllFilters() {
    setSelectedPropertyType("All");
    setSelectedPriceRange("All");
    setSelectedBedrooms("All");
    setSelectedBathrooms("All");
    setAmenityFilters({ wifi: false, ac: false, parking: false, furnished: false, security: false, elevator: false });
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchProperties(true)}
          colors={["#1D4ED8"]}
          tintColor="#1D4ED8"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Browse Properties</Text>
          <Text style={styles.subtitle}>
            {loading ? "Loading..." : `${filteredProperties.length} approved listings`}
          </Text>
        </View>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === "list" && styles.viewBtnActive]}
            onPress={() => setViewMode("list")}
          >
            <Ionicons name="list-outline" size={18} color={viewMode === "list" ? "#fff" : "#64748B"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === "grid" && styles.viewBtnActive]}
            onPress={() => setViewMode("grid")}
          >
            <Ionicons name="grid-outline" size={18} color={viewMode === "grid" ? "#fff" : "#64748B"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search + Filter Row */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={16} color={hasActiveFilters ? "#fff" : "#374151"} />
          <Text style={[styles.filterBtnText, hasActiveFilters && { color: "#fff" }]}>
            Filters{hasActiveFilters ? " •" : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <View style={styles.chipsRow}>
          {selectedPropertyType !== "All" && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{selectedPropertyType}</Text>
              <TouchableOpacity onPress={() => setSelectedPropertyType("All")}>
                <Ionicons name="close" size={13} color="#1D4ED8" />
              </TouchableOpacity>
            </View>
          )}
          {selectedPriceRange !== "All" && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{selectedPriceRange}</Text>
              <TouchableOpacity onPress={() => setSelectedPriceRange("All")}>
                <Ionicons name="close" size={13} color="#1D4ED8" />
              </TouchableOpacity>
            </View>
          )}
          {selectedBedrooms !== "All" && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{selectedBedrooms}{selectedBedrooms !== "Studio" ? " BR" : ""}</Text>
              <TouchableOpacity onPress={() => setSelectedBedrooms("All")}>
                <Ionicons name="close" size={13} color="#1D4ED8" />
              </TouchableOpacity>
            </View>
          )}
          {Object.entries(amenityFilters).filter(([, v]) => v).map(([k]) => (
            <View key={k} style={styles.chip}>
              <Text style={styles.chipText}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
              <TouchableOpacity onPress={() => setAmenityFilters({ ...amenityFilters, [k]: false })}>
                <Ionicons name="close" size={13} color="#1D4ED8" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearChip}>
            <Text style={styles.clearChipText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Properties List */}
      <View style={styles.list}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text style={styles.centerText}>Loading approved properties...</Text>
          </View>
        ) : fetchError ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={48} color="#DC2626" />
            <Text style={styles.errorTitle}>Could not load properties</Text>
            <Text style={styles.errorSub}>{fetchError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProperties()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProperties.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="home-outline" size={56} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No approved properties found</Text>
            <Text style={styles.emptySub}>
              {hasActiveFilters
                ? "Try adjusting your filters."
                : "Check back soon — new listings are approved regularly."}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.retryBtn} onPress={clearAllFilters}>
                <Text style={styles.retryBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredProperties.map((property) => {
            const amenityList = property.amenities
              ? property.amenities.split(",").map((a: string) => a.trim()).filter(Boolean)
              : [];
            const priceNum = parseFloat(property.price) || 0;
            const imageUri = property.first_image
              ? `${API_BASE_URL}/${property.first_image}`
              : null;

            return (
              <View key={property.id} style={styles.card}>
                {/* Image */}
                <View style={styles.imageBox}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={{ fontSize: 48 }}>🏢</Text>
                  </View>
                  {imageUri && (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.propertyImage}
                      resizeMode="cover"
                    />
                  )}
                  {/* Badges */}
                  <View style={styles.badgesRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {property.property_type || "Property"}
                      </Text>
                    </View>
                    {/* ✅ Only approved shows "Available" — this is now guaranteed by the fetch filter */}
                    <View style={styles.availableBadge}>
                      <Ionicons name="checkmark-circle" size={11} color="#fff" />
                      <Text style={styles.availableBadgeText}>Available</Text>
                    </View>
                  </View>
                </View>

                {/* Info */}
                <View style={styles.cardBody}>
                  <Text style={styles.propName}>{property.name}</Text>

                  <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={13} color="#64748B" />
                    <Text style={styles.addressText}>{property.address}</Text>
                  </View>

                  <View style={styles.specsRow}>
                    {property.rooms ? (
                      <View style={styles.specItem}>
                        <Ionicons name="bed-outline" size={13} color="#64748B" />
                        <Text style={styles.specText}>
                          {property.rooms} Room{parseInt(property.rooms) !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    ) : null}
                    {property.room_size ? (
                      <View style={styles.specItem}>
                        <Ionicons name="resize-outline" size={13} color="#64748B" />
                        <Text style={styles.specText}>{property.room_size}</Text>
                      </View>
                    ) : null}
                    {property.max_occupants ? (
                      <View style={styles.specItem}>
                        <Ionicons name="people-outline" size={13} color="#64748B" />
                        <Text style={styles.specText}>Max {property.max_occupants}</Text>
                      </View>
                    ) : null}
                  </View>

                  {amenityList.length > 0 && (
                    <View style={styles.amenitiesRow}>
                      {amenityList.slice(0, 4).map((amenity: string, index: number) => (
                        <View key={index} style={styles.amenityTag}>
                          <Text style={styles.amenityText}>{amenity}</Text>
                        </View>
                      ))}
                      {amenityList.length > 4 && (
                        <View style={styles.amenityTag}>
                          <Text style={styles.amenityText}>+{amenityList.length - 4}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.price}>₱{priceNum.toLocaleString()}</Text>
                      <Text style={styles.priceLabel}>/ month</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.bookBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/tenant/booking/[id]",
                          params: { id: property.id },
                        } as any)
                      }
                    >
                      <Text style={styles.bookBtnText}>Book Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
              {/* Property Type */}
              <Text style={styles.filterLabel}>Property Type</Text>
              <View style={styles.optionGrid}>
                {propertyTypeOptions.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.optionBtn, selectedPropertyType === type && styles.optionBtnActive]}
                    onPress={() => setSelectedPropertyType(type)}
                  >
                    <Text style={[styles.optionBtnText, selectedPropertyType === type && styles.optionBtnTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Range */}
              <Text style={styles.filterLabel}>Price Range</Text>
              {priceRangeOptions.map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[styles.listOption, selectedPriceRange === range && styles.listOptionActive]}
                  onPress={() => setSelectedPriceRange(range)}
                >
                  <Text style={[styles.listOptionText, selectedPriceRange === range && styles.listOptionTextActive]}>
                    {range}
                  </Text>
                  {selectedPriceRange === range && (
                    <Ionicons name="checkmark" size={16} color="#1D4ED8" />
                  )}
                </TouchableOpacity>
              ))}

              {/* Bedrooms */}
              <Text style={styles.filterLabel}>Bedrooms</Text>
              <View style={styles.optionGrid}>
                {bedroomOptions.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.optionBtn, selectedBedrooms === b && styles.optionBtnActive]}
                    onPress={() => setSelectedBedrooms(b)}
                  >
                    <Text style={[styles.optionBtnText, selectedBedrooms === b && styles.optionBtnTextActive]}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amenities */}
              <Text style={styles.filterLabel}>Amenities</Text>
              <View style={styles.checkboxGrid}>
                {Object.entries(amenityFilters).map(([key, val]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.checkboxRow}
                    onPress={() => setAmenityFilters({ ...amenityFilters, [key]: !val })}
                  >
                    <View style={[styles.checkbox, val && styles.checkboxChecked]}>
                      {val && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      {key === "ac" ? "Air Conditioning" : key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity style={styles.clearBtn} onPress={clearAllFilters}>
                  <Text style={styles.clearBtnText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
                  <Text style={styles.applyBtnText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", padding: 16, paddingTop: 20,
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  viewToggle: { flexDirection: "row", gap: 6 },
  viewBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center",
  },
  viewBtnActive: { backgroundColor: "#1D4ED8" },

  searchSection: {
    flexDirection: "row", gap: 10, padding: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#F8FAFC", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  searchInput: { flex: 1, fontSize: 13, color: "#1E293B" },
  filterBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F1F5F9", paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  filterBtnActive: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
  filterBtnText: { fontSize: 13, fontWeight: "600", color: "#374151" },

  chipsRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: "#BFDBFE",
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#1D4ED8" },
  clearChip: { paddingHorizontal: 10, paddingVertical: 5 },
  clearChipText: { fontSize: 12, color: "#94A3B8", fontWeight: "500" },

  list: { padding: 14, gap: 14 },

  center: { alignItems: "center", paddingVertical: 60, gap: 10 },
  centerText: { fontSize: 14, color: "#64748B", marginTop: 8 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#DC2626" },
  errorSub: { fontSize: 13, color: "#64748B", textAlign: "center", paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#94A3B8", marginTop: 8 },
  emptySub: { fontSize: 13, color: "#CBD5E1", textAlign: "center", paddingHorizontal: 20 },
  retryBtn: {
    backgroundColor: "#1D4ED8", paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 10, marginTop: 8,
  },
  retryBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  card: {
    backgroundColor: "#fff", borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  imageBox: { height: 190, backgroundColor: "#E2E8F0", position: "relative" },
  imagePlaceholder: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center", alignItems: "center",
  },
  propertyImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  badgesRow: { position: "absolute", top: 10, left: 10, gap: 6 },
  typeBadge: {
    backgroundColor: "#1D4ED8", paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 8,
  },
  typeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  availableBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#059669", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  availableBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  cardBody: { padding: 14 },
  propName: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 4, marginBottom: 10 },
  addressText: { fontSize: 13, color: "#64748B", flex: 1, lineHeight: 18 },
  specsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 10 },
  specItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  specText: { fontSize: 12, color: "#475569" },
  amenitiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  amenityTag: {
    backgroundColor: "#F1F5F9", paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 6,
  },
  amenityText: { fontSize: 11, color: "#64748B" },
  cardFooter: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 12,
  },
  price: { fontSize: 20, fontWeight: "800", color: "#1D4ED8" },
  priceLabel: { fontSize: 11, color: "#94A3B8", marginTop: 1 },
  bookBtn: {
    backgroundColor: "#1D4ED8", paddingHorizontal: 20,
    paddingVertical: 10, borderRadius: 10,
  },
  bookBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24,
    borderTopRightRadius: 24, maxHeight: "88%", paddingBottom: 32,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: "#E2E8F0",
    borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center",
  },
  filterScroll: { paddingHorizontal: 16 },
  filterLabel: {
    fontSize: 14, fontWeight: "700", color: "#0F172A",
    marginTop: 20, marginBottom: 10,
  },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  optionBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#F1F5F9", borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  optionBtnActive: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
  optionBtnText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  optionBtnTextActive: { color: "#fff" },
  listOption: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F8FAFC",
  },
  listOptionActive: {},
  listOptionText: { fontSize: 14, color: "#374151" },
  listOptionTextActive: { fontWeight: "700", color: "#1D4ED8" },
  checkboxGrid: { gap: 4, marginBottom: 8 },
  checkboxRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: "#CBD5E1",
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
  checkboxLabel: { fontSize: 14, color: "#374151" },
  filterActions: { flexDirection: "row", gap: 12, marginTop: 24, marginBottom: 8 },
  clearBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center",
  },
  clearBtnText: { color: "#64748B", fontWeight: "700", fontSize: 14 },
  applyBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: "#1D4ED8", alignItems: "center",
  },
  applyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
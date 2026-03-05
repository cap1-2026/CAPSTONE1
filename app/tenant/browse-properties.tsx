import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function BrowseProperties() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const propertyTypeParam = params.type as string || "All";

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list"); // list or grid
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedPropertyType, setSelectedPropertyType] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState("All");
  const [selectedBedrooms, setSelectedBedrooms] = useState("All");
  const [selectedBathrooms, setSelectedBathrooms] = useState("All");
  const [amenityFilters, setAmenityFilters] = useState({
    wifi: false,
    ac: false,
    parking: false,
    furnished: false,
    security: false,
    elevator: false,
  });

  const propertyTypeOptions = ["All", "Apartment", "Condominium", "Dormitory", "Transient"];
  const priceRangeOptions = ["All", "Under ₱10,000", "₱10,000 - ₱20,000", "₱20,000 - ₱30,000", "Above ₱30,000"];
  const bedroomOptions = ["All", "Studio", "1", "2", "3", "4+"];
  const bathroomOptions = ["All", "1", "2", "3+"];

  // Sample property data
  const properties = [
    {
      id: 1,
      type: "Apartment",
      name: "Cozy Studio Near Mall",
      address: "777 Shaw Blvd, Mandaluyong",
      bedrooms: 1,
      bathrooms: 1,
      sqm: 30,
      price: 10000,
      amenities: ["WiFi"],
      available: true,
      image: "https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Property+1",
    },
    {
      id: 2,
      type: "Condominium",
      name: "Luxury Condo Unit",
      address: "321 Ayala Ave, Makati City",
      bedrooms: 3,
      bathrooms: 2,
      sqm: 120,
      price: 35000,
      amenities: ["WiFi", "AC", "Parking", "+3 more"],
      available: true,
      image: "https://via.placeholder.com/400x300/2196F3/FFFFFF?text=Property+2",
    },
    {
      id: 3,
      type: "Apartment",
      name: "Modern Studio Unit",
      address: "555 Ortigas, Pasig City",
      bedrooms: 1,
      bathrooms: 1,
      sqm: 35,
      price: 12000,
      amenities: ["WiFi", "AC"],
      available: true,
      image: "https://via.placeholder.com/400x300/FF9800/FFFFFF?text=Property+3",
    },
    {
      id: 4,
      type: "Condominium",
      name: "Family Condo Unit",
      address: "123 Taguig Ave, Taguig City",
      bedrooms: 2,
      bathrooms: 2,
      sqm: 80,
      price: 25000,
      amenities: ["WiFi", "AC", "Parking"],
      available: true,
      image: "https://via.placeholder.com/400x300/9C27B0/FFFFFF?text=Property+4",
    },
    {
      id: 5,
      type: "Dormitory",
      name: "Student Dorm Room",
      address: "456 Espana, Manila",
      bedrooms: 1,
      bathrooms: 1,
      sqm: 15,
      price: 5000,
      amenities: ["WiFi"],
      available: true,
      image: "https://via.placeholder.com/400x300/F44336/FFFFFF?text=Property+5",
    },
    {
      id: 6,
      type: "Apartment",
      name: "Spacious 2BR Apartment",
      address: "789 Quezon Ave, Quezon City",
      bedrooms: 2,
      bathrooms: 1,
      sqm: 55,
      price: 18000,
      amenities: ["WiFi", "Parking"],
      available: true,
      image: "https://via.placeholder.com/400x300/00BCD4/FFFFFF?text=Property+6",
    },
  ];

  const filteredProperties = properties.filter((prop) => {
    const matchesSearch = prop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prop.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = propertyTypeParam === "All" || prop.type === propertyTypeParam;
    
    // Apply filters
    const matchesPropertyType = selectedPropertyType === "All" || prop.type === selectedPropertyType;
    
    let matchesPriceRange = true;
    if (selectedPriceRange === "Under ₱10,000") matchesPriceRange = prop.price < 10000;
    else if (selectedPriceRange === "₱10,000 - ₱20,000") matchesPriceRange = prop.price >= 10000 && prop.price <= 20000;
    else if (selectedPriceRange === "₱20,000 - ₱30,000") matchesPriceRange = prop.price >= 20000 && prop.price <= 30000;
    else if (selectedPriceRange === "Above ₱30,000") matchesPriceRange = prop.price > 30000;
    
    const matchesBedrooms = selectedBedrooms === "All" || 
                           (selectedBedrooms === "4+" ? prop.bedrooms >= 4 : prop.bedrooms.toString() === selectedBedrooms);
    
    const matchesBathrooms = selectedBathrooms === "All" || 
                            (selectedBathrooms === "3+" ? prop.bathrooms >= 3 : prop.bathrooms.toString() === selectedBathrooms);
    
    // Check amenities
    let matchesAmenities = true;
    if (amenityFilters.wifi && !prop.amenities.includes("WiFi")) matchesAmenities = false;
    if (amenityFilters.ac && !prop.amenities.includes("AC")) matchesAmenities = false;
    if (amenityFilters.parking && !prop.amenities.includes("Parking")) matchesAmenities = false;
    
    return matchesSearch && matchesType && matchesPropertyType && matchesPriceRange && 
           matchesBedrooms && matchesBathrooms && matchesAmenities;
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Browse Properties</Text>
          <Text style={styles.subtitle}>{filteredProperties.length} properties found</Text>
        </View>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[styles.viewButton, viewMode === "list" && styles.viewButtonActive]}
            onPress={() => setViewMode("list")}
          >
            <Text style={styles.viewButtonText}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewButton, viewMode === "grid" && styles.viewButtonActive]}
            onPress={() => setViewMode("grid")}
          >
            <Text style={styles.viewButtonText}>▦</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location or property name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterIcon}>⚙</Text>
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {(selectedPropertyType !== "All" || selectedPriceRange !== "All" || selectedBedrooms !== "All" || 
        selectedBathrooms !== "All" || Object.values(amenityFilters).some(v => v)) && (
        <View style={styles.activeFiltersContainer}>
          {selectedPropertyType !== "All" && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>{selectedPropertyType}</Text>
              <TouchableOpacity onPress={() => setSelectedPropertyType("All")}>
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {selectedPriceRange !== "All" && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>{selectedPriceRange}</Text>
              <TouchableOpacity onPress={() => setSelectedPriceRange("All")}>
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {selectedBedrooms !== "All" && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>{selectedBedrooms} {selectedBedrooms === "Studio" ? "" : "BR"}</Text>
              <TouchableOpacity onPress={() => setSelectedBedrooms("All")}>
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {selectedBathrooms !== "All" && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>{selectedBathrooms} BA</Text>
              <TouchableOpacity onPress={() => setSelectedBathrooms("All")}>
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {amenityFilters.wifi && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>WiFi</Text>
              <TouchableOpacity onPress={() => setAmenityFilters({ ...amenityFilters, wifi: false })}>
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {amenityFilters.ac && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>AC</Text>
              <TouchableOpacity onPress={() => setAmenityFilters({ ...amenityFilters, ac: false })}>
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {amenityFilters.parking && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Parking</Text>
              <TouchableOpacity onPress={() => setAmenityFilters({ ...amenityFilters, parking: false })}>
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {amenityFilters.furnished && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Furnished</Text>
              <TouchableOpacity onPress={() => setAmenityFilters({ ...amenityFilters, furnished: false })}>
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {amenityFilters.security && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Security</Text>
              <TouchableOpacity onPress={() => setAmenityFilters({ ...amenityFilters, security: false })}>
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {amenityFilters.elevator && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Elevator</Text>
              <TouchableOpacity onPress={() => setAmenityFilters({ ...amenityFilters, elevator: false })}>
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScroll}>
              {/* Property Type Dropdown */}
              <Text style={styles.filterLabel}>Property Type</Text>
              <View style={styles.dropdownContainer}>
                {propertyTypeOptions.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.dropdownOption, selectedPropertyType === type && styles.dropdownOptionActive]}
                    onPress={() => setSelectedPropertyType(type)}
                  >
                    <Text style={[styles.dropdownOptionText, selectedPropertyType === type && styles.dropdownOptionTextActive]}>
                      {type}
                    </Text>
                    {selectedPropertyType === type && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Range Dropdown */}
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.dropdownContainer}>
                {priceRangeOptions.map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[styles.dropdownOption, selectedPriceRange === range && styles.dropdownOptionActive]}
                    onPress={() => setSelectedPriceRange(range)}
                  >
                    <Text style={[styles.dropdownOptionText, selectedPriceRange === range && styles.dropdownOptionTextActive]}>
                      {range}
                    </Text>
                    {selectedPriceRange === range && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bedrooms Dropdown */}
              <Text style={styles.filterLabel}>Bedrooms</Text>
              <View style={styles.dropdownContainer}>
                {bedroomOptions.map((bedroom) => (
                  <TouchableOpacity
                    key={bedroom}
                    style={[styles.dropdownOption, selectedBedrooms === bedroom && styles.dropdownOptionActive]}
                    onPress={() => setSelectedBedrooms(bedroom)}
                  >
                    <Text style={[styles.dropdownOptionText, selectedBedrooms === bedroom && styles.dropdownOptionTextActive]}>
                      {bedroom}
                    </Text>
                    {selectedBedrooms === bedroom && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bathrooms Dropdown */}
              <Text style={styles.filterLabel}>Bathrooms</Text>
              <View style={styles.dropdownContainer}>
                {bathroomOptions.map((bathroom) => (
                  <TouchableOpacity
                    key={bathroom}
                    style={[styles.dropdownOption, selectedBathrooms === bathroom && styles.dropdownOptionActive]}
                    onPress={() => setSelectedBathrooms(bathroom)}
                  >
                    <Text style={[styles.dropdownOptionText, selectedBathrooms === bathroom && styles.dropdownOptionTextActive]}>
                      {bathroom}
                    </Text>
                    {selectedBathrooms === bathroom && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amenities Checkboxes */}
              <Text style={styles.filterLabel}>Amenities</Text>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAmenityFilters({ ...amenityFilters, wifi: !amenityFilters.wifi })}
                >
                  <View style={[styles.checkbox, amenityFilters.wifi && styles.checkboxActive]}>
                    {amenityFilters.wifi && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>WiFi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAmenityFilters({ ...amenityFilters, ac: !amenityFilters.ac })}
                >
                  <View style={[styles.checkbox, amenityFilters.ac && styles.checkboxActive]}>
                    {amenityFilters.ac && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Air Conditioning</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAmenityFilters({ ...amenityFilters, parking: !amenityFilters.parking })}
                >
                  <View style={[styles.checkbox, amenityFilters.parking && styles.checkboxActive]}>
                    {amenityFilters.parking && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Parking</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAmenityFilters({ ...amenityFilters, furnished: !amenityFilters.furnished })}
                >
                  <View style={[styles.checkbox, amenityFilters.furnished && styles.checkboxActive]}>
                    {amenityFilters.furnished && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Furnished</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAmenityFilters({ ...amenityFilters, security: !amenityFilters.security })}
                >
                  <View style={[styles.checkbox, amenityFilters.security && styles.checkboxActive]}>
                    {amenityFilters.security && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Security/Guard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAmenityFilters({ ...amenityFilters, elevator: !amenityFilters.elevator })}
                >
                  <View style={[styles.checkbox, amenityFilters.elevator && styles.checkboxActive]}>
                    {amenityFilters.elevator && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Elevator</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => {
                    setSelectedPropertyType("All");
                    setSelectedPriceRange("All");
                    setSelectedBedrooms("All");
                    setSelectedBathrooms("All");
                    setAmenityFilters({ wifi: false, ac: false, parking: false, furnished: false, security: false, elevator: false });
                  }}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => setShowFilters(false)}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.propertiesList}>
        {filteredProperties.map((property) => (
          <View key={property.id} style={styles.propertyCard}>
            <View style={styles.imageContainer}>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>🏢</Text>
              </View>
              <View style={styles.badges}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{property.type}</Text>
                </View>
                {property.available && (
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>Available</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.favoriteButton}>
                <Text style={styles.favoriteIcon}>♡</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.propertyInfo}>
              <Text style={styles.propertyName}>{property.name}</Text>
              <View style={styles.addressRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.address}>{property.address}</Text>
              </View>

              <View style={styles.specs}>
                <Text style={styles.specItem}>{property.bedrooms} BR</Text>
                <Text style={styles.specDivider}>•</Text>
                <Text style={styles.specItem}>{property.bathrooms} BA</Text>
                <Text style={styles.specDivider}>•</Text>
                <Text style={styles.specItem}>{property.sqm} sqm</Text>
              </View>

              <View style={styles.amenitiesRow}>
                {property.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityTag}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.footer}>
                <View>
                  <Text style={styles.price}>₱{property.price.toLocaleString()}</Text>
                  <Text style={styles.priceLabel}>per month</Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewDetailsButton}
                  onPress={() => router.push(`/tenant/browse-properties` as any)}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "#fff", padding: 16, paddingTop: 32, position: "relative", flexDirection: "row", alignItems: "flex-start", gap: 12 },
  backButton: { backgroundColor: "#f0f0f0", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginTop: 2 },
  backIcon: { fontSize: 20, color: "#333", fontWeight: "600" },
  headerContent: { flex: 1 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#666" },
  viewToggle: { position: "absolute", right: 16, top: 32, flexDirection: "row", gap: 6 },
  viewButton: { padding: 8, backgroundColor: "#f0f0f0", borderRadius: 6, width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  viewButtonActive: { backgroundColor: "#1a73e8" },
  viewButtonText: { fontSize: 16, color: "#666" },
  searchSection: { backgroundColor: "#fff", padding: 12, flexDirection: "column", gap: 8 },
  searchContainer: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, padding: 10, fontSize: 13 },
  filterButton: { backgroundColor: "#f5f5f5", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  filterIcon: { fontSize: 14 },
  filterText: { fontSize: 13, fontWeight: "500" },
  activeFiltersContainer: { backgroundColor: "#fff", paddingHorizontal: 12, paddingTop: 0, paddingBottom: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#007AFF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  filterChipText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  filterChipClose: { color: "#fff", fontSize: 14, fontWeight: "700", marginLeft: 2 },
  propertiesList: { padding: 12, gap: 12 },
  propertyCard: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  imageContainer: { position: "relative", height: 180 },
  imagePlaceholder: { width: "100%", height: "100%", backgroundColor: "#e0e0e0", justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { fontSize: 50 },
  badges: { position: "absolute", top: 10, left: 10, gap: 6 },
  typeBadge: { backgroundColor: "#1a73e8", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  typeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  availableBadge: { backgroundColor: "#4CAF50", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  availableBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  favoriteButton: { position: "absolute", top: 10, right: 10, backgroundColor: "#fff", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  favoriteIcon: { fontSize: 20, color: "#666" },
  propertyInfo: { padding: 14 },
  propertyName: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  addressRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  locationIcon: { fontSize: 12, marginRight: 4, marginTop: 2 },
  address: { fontSize: 13, color: "#666", flex: 1, lineHeight: 18 },
  specs: { flexDirection: "row", alignItems: "center", marginBottom: 10, flexWrap: "wrap" },
  specItem: { fontSize: 13, color: "#333" },
  specDivider: { marginHorizontal: 6, color: "#999" },
  amenitiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  amenityTag: { backgroundColor: "#f0f0f0", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  amenityText: { fontSize: 11, color: "#666" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  price: { fontSize: 20, fontWeight: "700", color: "#1a73e8" },
  priceLabel: { fontSize: 11, color: "#666" },
  viewDetailsButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#1a73e8", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  viewDetailsText: { color: "#1a73e8", fontWeight: "600", fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%", paddingBottom: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalClose: { fontSize: 28, color: "#666" },
  filterScroll: { padding: 16 },
  filterLabel: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 12 },
  dropdownContainer: { backgroundColor: "#f9f9f9", borderRadius: 8, overflow: "hidden", marginBottom: 8 },
  dropdownOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: "#eee" },
  dropdownOptionActive: { backgroundColor: "#007AFF" },
  dropdownOptionText: { fontSize: 14, color: "#333" },
  dropdownOptionTextActive: { color: "#fff", fontWeight: "600" },
  checkmark: { fontSize: 18, color: "#fff", fontWeight: "700" },
  checkboxContainer: { marginBottom: 8 },
  checkboxRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: "#007AFF", borderRadius: 4, marginRight: 12, justifyContent: "center", alignItems: "center" },
  checkboxActive: { backgroundColor: "#007AFF" },
  checkboxCheck: { color: "#fff", fontSize: 16, fontWeight: "700" },
  checkboxLabel: { fontSize: 14, color: "#333" },
  filterActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  clearButton: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: "#007AFF", alignItems: "center" },
  clearButtonText: { color: "#007AFF", fontWeight: "700", fontSize: 14 },
  applyButton: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: "#007AFF", alignItems: "center" },
  applyButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

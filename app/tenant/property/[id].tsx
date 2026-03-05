import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function PropertyDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Mock property data - in real app, fetch based on id
  const property = {
    id: id,
    name: "Sunshine Apartments Unit 3A",
    type: "Apartment",
    address: "123 Main St, Barangay San Antonio, Makati City, Metro Manila 1200",
    price: 15000,
    bedrooms: 1,
    bathrooms: 1,
    sqm: 50,
    maxGuests: 2,
    furnished: "Fully Furnished",
    minLease: "6 months",
    availableFrom: "March 1, 2026",
    available: true,
    description: "Beautiful fully furnished apartment in the heart of Makati. Perfect for young professionals or couples. Walking distance to MRT station and major shopping centers. The unit features modern appliances, ample storage space, and a balcony with city views.",
    amenities: {
      unit: ["WiFi", "Parking", "Air Conditioning", "Water Included", "Electricity Included"],
      building: ["24/7 Security", "Elevator", "CCTV"]
    },
    landmarks: [
      { name: "MRT Ayala Station", distance: "5 mins walk" },
      { name: "Greenbelt Mall", distance: "10 mins walk" },
      { name: "Glorietta Mall", distance: "8 mins walk" },
      { name: "Ayala Triangle Gardens", distance: "7 mins walk" },
      { name: "Multiple restaurants and cafes nearby", distance: "" }
    ],
    images: [
      "https://via.placeholder.com/800x500/4CAF50/FFFFFF?text=Living+Room",
      "https://via.placeholder.com/800x500/2196F3/FFFFFF?text=Bedroom",
      "https://via.placeholder.com/800x500/FF9800/FFFFFF?text=Kitchen",
      "https://via.placeholder.com/800x500/9C27B0/FFFFFF?text=Bathroom",
      "https://via.placeholder.com/800x500/F44336/FFFFFF?text=Balcony"
    ]
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentImageIndex(index);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color="#007AFF" />
        <Text style={styles.backText}>Back to Properties</Text>
      </TouchableOpacity>

      {/* Image Gallery */}
      <View style={styles.imageGallery}>
        <View style={styles.mainImage}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.imageScroller}
          >
            {property.images.map((img, index) => (
              <View key={index} style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>📸</Text>
              </View>
            ))}
          </ScrollView>
          
          {/* Available Badge */}
          {property.available && (
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>Available Now</Text>
            </View>
          )}

          {/* Image Dots */}
          <View style={styles.dotsContainer}>
            {property.images.map((_, index) => (
              <View 
                key={index} 
                style={[styles.dot, currentImageIndex === index && styles.dotActive]} 
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Property Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.propertyName}>{property.name}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.address}>{property.address}</Text>
            </View>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{property.type}</Text>
          </View>
        </View>

        {/* Specs Grid */}
        <View style={styles.specsGrid}>
          <View style={styles.specItem}>
            <Ionicons name="bed-outline" size={28} color="#666" />
            <Text style={styles.specNumber}>{property.bedrooms}</Text>
            <Text style={styles.specLabel}>Bedroom</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="water-outline" size={28} color="#666" />
            <Text style={styles.specNumber}>{property.bathrooms}</Text>
            <Text style={styles.specLabel}>Bathroom</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="resize-outline" size={28} color="#666" />
            <Text style={styles.specNumber}>{property.sqm}</Text>
            <Text style={styles.specLabel}>sqm</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="people-outline" size={28} color="#666" />
            <Text style={styles.specNumber}>{property.maxGuests}</Text>
            <Text style={styles.specLabel}>Max Guests</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{property.description}</Text>
        </View>

        {/* Amenities & Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities & Features</Text>
          
          <Text style={styles.amenityGroupTitle}>Included in Unit</Text>
          <View style={styles.amenitiesList}>
            {property.amenities.unit.map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.amenityGroupTitle, { marginTop: 20 }]}>Building Amenities</Text>
          <View style={styles.amenitiesList}>
            {property.amenities.building.map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#2196F3" />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nearby Landmarks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Landmarks & Commute</Text>
          <View style={styles.landmarksList}>
            {property.landmarks.map((landmark, index) => (
              <View key={index} style={styles.landmarkItem}>
                <Ionicons name="location-outline" size={18} color="#666" />
                <Text style={styles.landmarkText}>
                  {landmark.name}
                  {landmark.distance && <Text style={styles.landmarkDistance}> - {landmark.distance}</Text>}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Card */}
        <View style={styles.pricingCard}>
          <View style={styles.priceSection}>
            <Text style={styles.priceAmount}>₱{property.price.toLocaleString()}</Text>
            <Text style={styles.priceLabel}>per month</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Furnished:</Text>
            <Text style={styles.detailValue}>{property.furnished}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Min Lease:</Text>
            <Text style={styles.detailValue}>{property.minLease}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Available from:</Text>
            <Text style={styles.detailValue}>{property.availableFrom}</Text>
          </View>

          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => router.push(`/tenant/booking/${id}` as any)}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageButton}>
            <Text style={styles.messageButtonText}>Send Message</Text>
          </TouchableOpacity>

          {/* Verification Badges */}
          <View style={styles.badges}>
            <View style={styles.badgeItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.badgeText}>Verified property</Text>
            </View>
            <View style={styles.badgeItem}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={styles.badgeText}>Secure payment with escrow</Text>
            </View>
            <View style={styles.badgeItem}>
              <Ionicons name="document-text" size={20} color="#4CAF50" />
              <Text style={styles.badgeText}>Digital contract & IoT keys</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  backButton: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#fff", gap: 8 },
  backText: { fontSize: 16, color: "#007AFF", fontWeight: "500" },
  imageGallery: { backgroundColor: "#fff" },
  mainImage: { height: 400, backgroundColor: "#e0e0e0", position: "relative" },
  imageScroller: { flex: 1 },
  imagePlaceholder: { width: width, height: 400, justifyContent: "center", alignItems: "center", backgroundColor: "#e0e0e0" },
  imagePlaceholderText: { fontSize: 80 },
  availableBadge: { position: "absolute", top: 16, right: 16, backgroundColor: "#4CAF50", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  availableBadgeText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  dotsContainer: { position: "absolute", bottom: 16, left: 0, right: 0, flexDirection: "row", gap: 8, justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: "#fff", width: 24 },
  content: { padding: 16 },
  header: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flex: 1, marginRight: 12 },
  propertyName: { fontSize: 24, fontWeight: "700", color: "#333", marginBottom: 8 },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  address: { fontSize: 14, color: "#666", flex: 1, lineHeight: 20 },
  typeBadge: { backgroundColor: "#E3F2FD", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  typeBadgeText: { color: "#007AFF", fontWeight: "600", fontSize: 13 },
  specsGrid: { flexDirection: "row", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, justifyContent: "space-around" },
  specItem: { alignItems: "center", gap: 4 },
  specNumber: { fontSize: 20, fontWeight: "700", color: "#333", marginTop: 4 },
  specLabel: { fontSize: 12, color: "#666" },
  section: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 12 },
  description: { fontSize: 15, color: "#666", lineHeight: 24 },
  amenityGroupTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 12 },
  amenitiesList: { gap: 12 },
  amenityItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  amenityText: { fontSize: 15, color: "#666" },
  landmarksList: { gap: 12 },
  landmarkItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  landmarkText: { fontSize: 15, color: "#666", flex: 1 },
  landmarkDistance: { color: "#999" },
  pricingCard: { backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 20 },
  priceSection: { marginBottom: 20 },
  priceAmount: { fontSize: 32, fontWeight: "700", color: "#007AFF" },
  priceLabel: { fontSize: 14, color: "#666", marginTop: 4 },
  detailsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  detailLabel: { fontSize: 14, color: "#666" },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#333" },
  bookButton: { backgroundColor: "#007AFF", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 20 },
  bookButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  messageButton: { backgroundColor: "#fff", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: "#ddd" },
  messageButtonText: { color: "#333", fontSize: 16, fontWeight: "600" },
  badges: { marginTop: 20, gap: 12 },
  badgeItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  badgeText: { fontSize: 14, color: "#666" },
});

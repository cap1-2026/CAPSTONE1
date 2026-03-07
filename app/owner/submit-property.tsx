import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

export default function OwnerApply() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idFile, setIdFile] = useState<any>(null);
  const [ownershipFile, setOwnershipFile] = useState<any>(null);
  const [hasDocumentPicker, setHasDocumentPicker] = useState<boolean>(false);
  const [agree, setAgree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Property Details
  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [landmark, setLandmark] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [showBedroomsDropdown, setShowBedroomsDropdown] = useState(false);
  const [bathrooms, setBathrooms] = useState("");
  const [showBathroomsDropdown, setShowBathroomsDropdown] = useState(false);
  const [floorArea, setFloorArea] = useState("");
  const [description, setDescription] = useState("");
  const [propertyImages, setPropertyImages] = useState<any[]>([]);

  // Amenities
  const [hasParking, setHasParking] = useState(false);
  const [parkingType, setParkingType] = useState(""); // "motorcycle" or "4wheels" or "both"
  const [hasWifi, setHasWifi] = useState(false);
  const [hasWater, setHasWater] = useState(false);
  const [hasElectricity, setHasElectricity] = useState(false);
  const [hasAircon, setHasAircon] = useState(false);
  const [hasFurnished, setHasFurnished] = useState(false);
  const [hasSecurity, setHasSecurity] = useState(false);
  const [hasElevator, setHasElevator] = useState(false);

  useEffect(() => {
    try {
      const dp = require("expo-document-picker");
      if (dp) setHasDocumentPicker(true);
    } catch (e) {
      setHasDocumentPicker(false);
    }
  }, []);

  // Load existing property data when editing
  useEffect(() => {
    const id = params.id ? Number(params.id) : null;
    if (!id) return;
    setEditId(id);

    fetch(`${API_ENDPOINTS.GET_PROPERTIES}?property_id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.status !== "success") return;
        const p = data.data;
        setPropertyTitle(p.name || "");
        setPropertyType(p.property_type || "");
        setMonthlyRent(p.price ? String(Math.round(parseFloat(p.price))) : "");
        setAddress(p.address || "");
        setBedrooms(p.rooms ? String(p.rooms) : "");
        setFloorArea(p.room_size || "");
        setDescription(p.rules || "");

        // Parse amenities string back into toggles
        const am = (p.amenities || "").toLowerCase();
        setHasWifi(am.includes("wifi"));
        setHasWater(am.includes("water"));
        setHasElectricity(am.includes("electricity"));
        setHasAircon(am.includes("aircon") || am.includes("air con"));
        setHasFurnished(am.includes("furnished"));
        setHasSecurity(am.includes("security"));
        setHasElevator(am.includes("elevator"));
        setHasParking(am.includes("parking"));
      })
      .catch(() => {});
  }, [params.id]);

  async function pickDocumentImage(setter: (f: any) => void) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0]);
    }
  }

  async function pickPropertyImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPropertyImages(prev => [...prev, ...result.assets]);
    }
  }

  function removeImage(index: number) {
    setPropertyImages(prev => prev.filter((_, i) => i !== index));
  }

  function validate() {
    if (!propertyTitle.trim()) {
      Alert.alert("Missing Information", "Please enter a property title.");
      return false;
    }
    if (!monthlyRent.trim()) {
      Alert.alert("Missing Information", "Please enter the monthly rent.");
      return false;
    }
    if (!address.trim() || !city.trim()) {
      Alert.alert("Missing Information", "Please enter the property address and city.");
      return false;
    }
    return true;
  }

  async function submit() {
    if (!validate()) return;

    const user = await UserStorage.getUser();
    const ownerId = user?.user_id ?? 1;

    setIsSubmitting(true);
    try {
      const amenityList = [];
      if (hasWifi) amenityList.push("WiFi");
      if (hasWater) amenityList.push("Water");
      if (hasElectricity) amenityList.push("Electricity");
      if (hasAircon) amenityList.push("Aircon");
      if (hasFurnished) amenityList.push("Furnished");
      if (hasSecurity) amenityList.push("Security");
      if (hasElevator) amenityList.push("Elevator");
      if (hasParking) amenityList.push(`Parking(${parkingType || "any"})`);

      const fullAddress = [address, city, province, landmark].filter(Boolean).join(", ");

      let propertyId: number;

      if (editId) {
        // Editing an existing property
        const response = await fetch(API_ENDPOINTS.UPDATE_PROPERTY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: editId,
            property_name: propertyTitle,
            property_type: propertyType || "Apartment",
            address: fullAddress,
            rooms: parseInt(bedrooms) || 1,
            room_size: floorArea,
            max_occupants: 1,
            amenities: amenityList.join(", "),
            price: parseFloat(monthlyRent) || 0,
            deposit: parseFloat(monthlyRent) || 0,
            rules: description,
          }),
        });
        const data = await response.json();
        if (data.status !== "success" && data.status !== "info") {
          Alert.alert("Failed", data.message || "Could not update property.");
          setIsSubmitting(false);
          return;
        }
        propertyId = editId;
      } else {
        // Creating a new property
        const response = await fetch(API_ENDPOINTS.ADD_PROPERTY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner_id: ownerId,
            property_name: propertyTitle,
            property_type: propertyType || "Apartment",
            address: fullAddress,
            rooms: parseInt(bedrooms) || 1,
            room_size: floorArea,
            max_occupants: 1,
            amenities: amenityList.join(", "),
            price: parseFloat(monthlyRent) || 0,
            deposit: parseFloat(monthlyRent) || 0,
            rules: description,
          }),
        });
        const data = await response.json();
        if (data.status !== "success") {
          Alert.alert("Failed", data.message || "Could not save property.");
          setIsSubmitting(false);
          return;
        }
        propertyId = data.property_id;
      }

      for (const img of propertyImages) {
        try {
          const imgForm = new FormData();
          imgForm.append("property_id", String(propertyId));

          // On Expo Web, img.uri is a blob: URL — fetch it to get real binary data
          const blobRes = await fetch(img.uri);
          const blob = await blobRes.blob();
          const fileName = img.fileName || `photo_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
          imgForm.append("image", file, fileName);

          await fetch(API_ENDPOINTS.UPLOAD_IMAGES, { method: "POST", body: imgForm });
        } catch (_) {}
      }

      setIsSubmitting(false);
      Alert.alert(
        editId ? "Property Updated!" : "Property Submitted!",
        editId ? "Your property has been updated successfully." : "Your property has been saved successfully."
      );
      router.replace("/owner/properties");
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert("Error", "Failed to submit. Please check your connection and try again.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Owner Information</Text>

      <Text style={styles.label}>Full Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Juan Dela Cruz" />

      <Text style={styles.label}>Email Address *</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="juan@example.com" />

      <Text style={styles.label}>Phone Number *</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+63 912 345 6789" />

      <Text style={styles.label}>Government-Issued ID *</Text>
      <TouchableOpacity
        style={[styles.upload, idFile && styles.uploadDone]}
        onPress={() => pickDocumentImage(setIdFile)}
      >
        {idFile ? (
          <View style={styles.docPreviewRow}>
            <Image source={{ uri: idFile.uri }} style={styles.docPreview} />
            <View style={styles.docPreviewInfo}>
              <Text style={styles.docPreviewDone}>✓ ID Uploaded</Text>
              <Text style={styles.docPreviewChange}>Tap to change</Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.uploadText}>📷  Tap to upload Government ID</Text>
            <Text style={styles.hint}>JPG, PNG — Driver's License, Passport, National ID</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Proof of Property Ownership *</Text>
      <TouchableOpacity
        style={[styles.upload, ownershipFile && styles.uploadDone]}
        onPress={() => pickDocumentImage(setOwnershipFile)}
      >
        {ownershipFile ? (
          <View style={styles.docPreviewRow}>
            <Image source={{ uri: ownershipFile.uri }} style={styles.docPreview} />
            <View style={styles.docPreviewInfo}>
              <Text style={styles.docPreviewDone}>✓ Ownership Doc Uploaded</Text>
              <Text style={styles.docPreviewChange}>Tap to change</Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.uploadText}>📷  Tap to upload Ownership Document</Text>
            <Text style={styles.hint}>JPG, PNG — Land title, tax declaration</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Property Details</Text>

      <Text style={styles.label}>Property Title *</Text>
      <TextInput style={styles.input} value={propertyTitle} onChangeText={setPropertyTitle} placeholder="Modern 2BR Apartment" />

      <Text style={styles.label}>Property Type *</Text>
      <TouchableOpacity 
        style={styles.dropdownSelector} 
        onPress={() => setShowPropertyTypeDropdown(!showPropertyTypeDropdown)}
      >
        <Text style={[styles.dropdownSelectorText, !propertyType && styles.dropdownPlaceholder]}>
          {propertyType || "Select property type"}
        </Text>
        <Text style={styles.dropdownArrow}>{showPropertyTypeDropdown ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {showPropertyTypeDropdown && (
        <View style={styles.quickSelect}>
          {["Apartment", "Condominium", "Dormitory", "Transient"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.quickSelectButton, propertyType === type && styles.quickSelectButtonActive]}
              onPress={() => {
                setPropertyType(type);
                setShowPropertyTypeDropdown(false);
              }}
            >
              <Text style={[styles.quickSelectButtonText, propertyType === type && styles.quickSelectButtonTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Monthly Rent (₱) *</Text>
      <TextInput 
        style={styles.input} 
        value={monthlyRent} 
        onChangeText={(text) => setMonthlyRent(text.replace(/[^0-9]/g, ''))} 
        keyboardType="numeric" 
        placeholder="15000" 
      />

      <Text style={styles.sectionTitle}>Location</Text>

      <Text style={styles.label}>Street Address *</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="123 Main Street, Barangay Example" />

      <Text style={styles.label}>City *</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Manila" />

      <Text style={styles.label}>Province/State *</Text>
      <TextInput style={styles.input} value={province} onChangeText={setProvince} placeholder="Metro Manila" />

      <Text style={styles.label}>Nearby Landmark</Text>
      <TextInput style={styles.input} value={landmark} onChangeText={setLandmark} placeholder="Near SM Mall, LRT Station, etc." />

      <Text style={styles.sectionTitle}>Property Specifications</Text>

      <Text style={styles.label}>Number of Bedrooms *</Text>
      <TouchableOpacity 
        style={styles.dropdownSelector} 
        onPress={() => setShowBedroomsDropdown(!showBedroomsDropdown)}
      >
        <Text style={[styles.dropdownSelectorText, !bedrooms && styles.dropdownPlaceholder]}>
          {bedrooms || "Select number of bedrooms"}
        </Text>
        <Text style={styles.dropdownArrow}>{showBedroomsDropdown ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {showBedroomsDropdown && (
        <View style={styles.quickSelect}>
          {[0, 1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.quickSelectButton, bedrooms === String(num) && styles.quickSelectButtonActive]}
              onPress={() => {
                setBedrooms(String(num));
                setShowBedroomsDropdown(false);
              }}
            >
              <Text style={[styles.quickSelectButtonText, bedrooms === String(num) && styles.quickSelectButtonTextActive]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Number of Bathrooms *</Text>
      <TouchableOpacity 
        style={styles.dropdownSelector} 
        onPress={() => setShowBathroomsDropdown(!showBathroomsDropdown)}
      >
        <Text style={[styles.dropdownSelectorText, !bathrooms && styles.dropdownPlaceholder]}>
          {bathrooms || "Select number of bathrooms"}
        </Text>
        <Text style={styles.dropdownArrow}>{showBathroomsDropdown ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {showBathroomsDropdown && (
        <View style={styles.quickSelect}>
          {[0, 1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.quickSelectButton, bathrooms === String(num) && styles.quickSelectButtonActive]}
              onPress={() => {
                setBathrooms(String(num));
                setShowBathroomsDropdown(false);
              }}
            >
              <Text style={[styles.quickSelectButtonText, bathrooms === String(num) && styles.quickSelectButtonTextActive]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Floor Area (sq.m) *</Text>
      <TextInput 
        style={styles.input} 
        value={floorArea} 
        onChangeText={(text) => setFloorArea(text.replace(/[^0-9]/g, ''))} 
        keyboardType="numeric" 
        placeholder="45" 
      />

      <Text style={styles.label}>Property Description *</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        value={description} 
        onChangeText={setDescription} 
        placeholder="Describe your property, its features, and what makes it special..."
        multiline
        numberOfLines={4}
      />

      <Text style={styles.sectionTitle}>Amenities</Text>

      <View style={styles.rowCenter}>
        <Switch value={hasParking} onValueChange={(value) => {
          setHasParking(value);
          if (!value) setParkingType("");
        }} />
        <Text style={styles.amenityText}>Parking</Text>
      </View>

      {hasParking && (
        <View style={styles.parkingOptions}>
          <Text style={styles.parkingLabel}>Select parking type:</Text>
          <View style={styles.parkingButtonContainer}>
            <TouchableOpacity
              style={[styles.parkingButton, parkingType === "motorcycle" && styles.parkingButtonActive]}
              onPress={() => setParkingType("motorcycle")}
            >
              <Text style={[styles.parkingButtonText, parkingType === "motorcycle" && styles.parkingButtonTextActive]}>
                Motorcycle Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.parkingButton, parkingType === "4wheels" && styles.parkingButtonActive]}
              onPress={() => setParkingType("4wheels")}
            >
              <Text style={[styles.parkingButtonText, parkingType === "4wheels" && styles.parkingButtonTextActive]}>
                4 Wheels
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.parkingButton, parkingType === "both" && styles.parkingButtonActive]}
              onPress={() => setParkingType("both")}
            >
              <Text style={[styles.parkingButtonText, parkingType === "both" && styles.parkingButtonTextActive]}>
                Both
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.rowCenter}>
        <Switch value={hasWifi} onValueChange={setHasWifi} />
        <Text style={styles.amenityText}>WiFi</Text>
      </View>

      <View style={styles.rowCenter}>
        <Switch value={hasWater} onValueChange={setHasWater} />
        <Text style={styles.amenityText}>Water Supply</Text>
      </View>

      <View style={styles.rowCenter}>
        <Switch value={hasElectricity} onValueChange={setHasElectricity} />
        <Text style={styles.amenityText}>Electricity</Text>
      </View>

      <View style={styles.rowCenter}>
        <Switch value={hasAircon} onValueChange={setHasAircon} />
        <Text style={styles.amenityText}>Air Conditioning</Text>
      </View>

      <View style={styles.rowCenter}>
        <Switch value={hasFurnished} onValueChange={setHasFurnished} />
        <Text style={styles.amenityText}>Furnished</Text>
      </View>

      <View style={styles.rowCenter}>
        <Switch value={hasSecurity} onValueChange={setHasSecurity} />
        <Text style={styles.amenityText}>Security/Guard</Text>
      </View>

      <View style={styles.rowCenter}>
        <Switch value={hasElevator} onValueChange={setHasElevator} />
        <Text style={styles.amenityText}>Elevator</Text>
      </View>

      <Text style={styles.label}>Property Images</Text>
      <TouchableOpacity style={styles.upload} onPress={pickPropertyImage}>
        <Text style={styles.uploadText}>+ Add Property Photos</Text>
        <Text style={styles.hint}>JPG, PNG — tap to select from gallery</Text>
      </TouchableOpacity>

      {propertyImages.length > 0 && (
        <View style={styles.imagePreviewRow}>
          {propertyImages.map((img, index) => (
            <View key={index} style={styles.imagePreviewWrapper}>
              <Image source={{ uri: img.uri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.rowCenter}>
        <Switch value={agree} onValueChange={setAgree} />
        <Text style={styles.agreeText}> I agree to the terms and conditions and management contract. I certify that all information provided is accurate and I am the legal owner of the property.</Text>
      </View>

      <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={submit} disabled={isSubmitting}>
        <Text style={styles.buttonText}>{isSubmitting ? "Saving..." : editId ? "Save Changes" : "Submit Application"}</Text>
      </TouchableOpacity>

      <View style={styles.whatsNext}>
        <Text style={styles.sectionTitle}>What happens next?</Text>
        <Text style={styles.bullet}>• Your application will be reviewed within 2-3 business days</Text>
        <Text style={styles.bullet}>• We'll verify your identity and ownership documents</Text>
        <Text style={styles.bullet}>• You'll receive an email notification about your application status</Text>
        <Text style={styles.bullet}>• Once approved, you can start listing your properties</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  backButton: { backgroundColor: "#f0f0f0", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  backIcon: { fontSize: 20, color: "#333", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "600", flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 20, marginBottom: 8, color: "#007AFF" },
  label: { marginTop: 12, fontSize: 14, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 6, marginTop: 6 },
  dropdownSelector: { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 6, marginTop: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff" },
  dropdownSelectorText: { fontSize: 14, color: "#333", flex: 1 },
  dropdownPlaceholder: { color: "#999" },
  dropdownArrow: { color: "#007AFF", fontSize: 14, fontWeight: "600", marginLeft: 8 },
  quickSelectContainer: { flexDirection: "row", alignItems: "stretch", marginTop: 6 },
  dropdownToggle: { backgroundColor: "#007AFF", paddingHorizontal: 12, justifyContent: "center", borderTopLeftRadius: 6, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: "#007AFF" },
  dropdownToggleText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  inputWithDropdown: { flex: 1, marginTop: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },
  quickSelect: { flexDirection: "column", marginTop: 8, marginBottom: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, overflow: "hidden" },
  quickSelectButton: { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  quickSelectButtonActive: { backgroundColor: "#007AFF" },
  quickSelectButtonText: { fontSize: 14, fontWeight: "500", color: "#333", textAlign: "center" },
  quickSelectButtonTextActive: { color: "#fff" },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  upload: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 6, marginTop: 6 },
  uploadDone: { borderColor: "#4CAF50", backgroundColor: "#f0fff4" },
  uploadText: { fontSize: 14 },
  hint: { fontSize: 12, color: "#666", marginTop: 6 },
  docPreviewRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  docPreview: { width: 64, height: 64, borderRadius: 6, backgroundColor: "#eee" },
  docPreviewInfo: { flex: 1 },
  docPreviewDone: { fontSize: 14, fontWeight: "700", color: "#4CAF50" },
  docPreviewChange: { fontSize: 12, color: "#888", marginTop: 2 },
  imagePreviewRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  imagePreviewWrapper: { position: "relative" },
  imagePreview: { width: 90, height: 90, borderRadius: 8, backgroundColor: "#eee" },
  removeImageBtn: { position: "absolute", top: -6, right: -6, backgroundColor: "#ff3b30", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  removeImageText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  rowCenter: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  agreeText: { flex: 1, marginLeft: 8, fontSize: 13 },
  amenityText: { marginLeft: 8, fontSize: 14 },
  parkingOptions: { marginLeft: 40, marginTop: 8, marginBottom: 8 },
  parkingLabel: { fontSize: 13, color: "#666", marginBottom: 8 },
  parkingButtonContainer: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  parkingButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#f9f9f9" },
  parkingButtonActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  parkingButtonText: { fontSize: 13, color: "#333" },
  parkingButtonTextActive: { color: "#fff", fontWeight: "500" },
  button: { backgroundColor: "#007AFF", padding: 14, borderRadius: 8, marginTop: 16, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#aacff8" },
  buttonText: { color: "#fff", fontWeight: "600" },
  whatsNext: { marginTop: 20, backgroundColor: "#fff", padding: 12, borderRadius: 8 },
  bullet: { marginTop: 6, color: "#333" },
});

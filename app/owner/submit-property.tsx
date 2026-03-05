import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from "react-native";
// We dynamically require `expo-document-picker` at runtime so the app
// doesn't crash if the dependency hasn't been installed yet.
import { useRouter } from "expo-router";

export default function OwnerApply() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idFile, setIdFile] = useState<any>(null);
  const [ownershipFile, setOwnershipFile] = useState<any>(null);
  const [hasDocumentPicker, setHasDocumentPicker] = useState<boolean>(false);
  const [agree, setAgree] = useState(false);

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
    // detect availability once so UI can adapt
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      // require may throw if module isn't installed
      // and this keeps Metro from crashing on static import
      // when the package is missing.
      // @ts-ignore
      const dp = require("expo-document-picker");
      if (dp) setHasDocumentPicker(true);
    } catch (e) {
      setHasDocumentPicker(false);
    }
  }, []);

  async function pickFile(setter: (f: any) => void) {
    if (!hasDocumentPicker) {
      Alert.alert(
        "Upload unavailable",
        "File uploads require the optional package `expo-document-picker`. Install it and run `npm install` in the project to enable attachments.",
      );
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const DocumentPickerModule = require("expo-document-picker");
      const res = await DocumentPickerModule.getDocumentAsync({ copyToCacheDirectory: false });
      if (res && res.type === "success") setter(res);
    } catch (err) {
      console.warn("File pick error", err);
      Alert.alert("Upload failed", "Unable to pick a file. Try again or install `expo-document-picker`.");
    }
  }

  function validate() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Missing Information", "Please fill out all required owner fields.");
      return false;
    }
    if (!propertyTitle.trim() || !propertyType.trim() || !monthlyRent.trim() || 
        !address.trim() || !city.trim() || !province.trim() || 
        !bedrooms.trim() || !bathrooms.trim() || !floorArea.trim() || !description.trim()) {
      Alert.alert("Missing Information", "Please fill out all required property fields.");
      return false;
    }
    if (!idFile || !ownershipFile) {
      if (!hasDocumentPicker) {
        // allow submission but inform user that attachments were not included
        return true;
      }
      Alert.alert(
        "Missing documents",
        "You haven't attached identity or ownership documents. Please attach them before submission.",
      );
      return false;
    }
    if (!agree) {
      Alert.alert("You must agree to the terms and management contract.");
      return false;
    }
    return true;
  }

  function submit() {
    if (!validate()) return;
    // Placeholder: submit to backend API
    router.replace("/owner/review");
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
      <TouchableOpacity style={styles.upload} onPress={() => pickFile(setIdFile)}>
        <Text style={styles.uploadText}>{idFile ? idFile.name : "Click to upload or drag and drop"}</Text>
        <Text style={styles.hint}>PDF, JPG, PNG (max 10MB)</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Proof of Property Ownership *</Text>
      <TouchableOpacity style={styles.upload} onPress={() => pickFile(setOwnershipFile)}>
        <Text style={styles.uploadText}>{ownershipFile ? ownershipFile.name : "Land title, tax declaration (max 10MB)"}</Text>
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
      <TouchableOpacity style={styles.upload} onPress={() => pickFile((f: any) => setPropertyImages([...propertyImages, f]))}>
        <Text style={styles.uploadText}>
          {propertyImages.length > 0 ? `${propertyImages.length} image(s) selected` : "Click to upload property images"}
        </Text>
        <Text style={styles.hint}>JPG, PNG (max 10MB each)</Text>
      </TouchableOpacity>

      <View style={styles.rowCenter}>
        <Switch value={agree} onValueChange={setAgree} />
        <Text style={styles.agreeText}> I agree to the terms and conditions and management contract. I certify that all information provided is accurate and I am the legal owner of the property.</Text>
      </View>

      <TouchableOpacity style={[styles.button, !agree && styles.buttonDisabled]} onPress={submit} disabled={!agree}>
        <Text style={styles.buttonText}>Submit Application</Text>
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
  uploadText: { fontSize: 14 },
  hint: { fontSize: 12, color: "#666", marginTop: 6 },
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

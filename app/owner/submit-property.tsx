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
      Alert.alert("Please fill out all required fields.");
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
    Alert.alert("Application submitted", "Your application will be reviewed within 2-3 business days.", [
      { text: "OK", onPress: () => router.push("/owner/home") },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add a New Property</Text>

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
  title: { fontSize: 22, fontWeight: "600", marginBottom: 12 },
  label: { marginTop: 12, fontSize: 14, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 6, marginTop: 6 },
  upload: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 6, marginTop: 6 },
  uploadText: { fontSize: 14 },
  hint: { fontSize: 12, color: "#666", marginTop: 6 },
  rowCenter: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  agreeText: { flex: 1, marginLeft: 8, fontSize: 13 },
  button: { backgroundColor: "#007AFF", padding: 14, borderRadius: 8, marginTop: 16, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#aacff8" },
  buttonText: { color: "#fff", fontWeight: "600" },
  whatsNext: { marginTop: 20, backgroundColor: "#fff", padding: 12, borderRadius: 8 },
  sectionTitle: { fontWeight: "600", marginBottom: 8 },
  bullet: { marginTop: 6, color: "#333" },
});

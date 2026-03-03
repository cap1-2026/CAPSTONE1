import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function RoleRegister() {
  const { role } = useLocalSearchParams() as { role?: string };
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert("Validation", "Fill all fields to register");
      return;
    }

    // Mock registration: in a real app call API to create user and return success
    Alert.alert("Registered", `Account created for ${role}`);
    const r = (role || "tenant") as "tenant" | "owner";
    const target: "/tenant/home" | "/owner/home" = r === "tenant" ? "/tenant/home" : "/owner/home";
    router.replace(target);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register as {role}</Text>
      <TextInput placeholder="Full name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, textAlign: "center", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 6, marginBottom: 12 },
});

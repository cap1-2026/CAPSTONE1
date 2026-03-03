import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function RoleLogin() {
  const { role } = useLocalSearchParams() as { role?: string };
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {
    if (!username || !password) {
      Alert.alert("Validation", "Please enter username and password");
      return;
    }

    // Mock authentication: in real app call API and validate role
    const r = (role || "tenant") as "tenant" | "owner";
    const target: "/tenant/home" | "/owner/home" =
      r === "tenant" ? "/tenant/home" : "/owner/home";
    router.replace(target);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role?.toString().toUpperCase()} Login</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Login" onPress={handleLogin} />
      <View style={{ height: 12 }} />
      <Button
        title="No account? Register"
        onPress={() => router.push({ pathname: "/register/[role]", params: { role: role ?? "tenant" } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, textAlign: "center", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 6, marginBottom: 12 },
});

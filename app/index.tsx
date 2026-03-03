import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  function goToRole(role: string) {
    router.push({ pathname: "/login/[role]", params: { role } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select your role</Text>
      <TouchableOpacity style={styles.button} onPress={() => goToRole("tenant")}>
        <Text style={styles.buttonText}>Tenant</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => goToRole("owner")}>
        <Text style={styles.buttonText}>Owner</Text>
      </TouchableOpacity>
      {/* Admin removed - registration/login available for Tenant and Owner */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, marginBottom: 20 },
  button: { backgroundColor: "#0a84ff", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, marginVertical: 6, width: "60%", alignItems: "center" },
  buttonText: { color: "white", fontSize: 16 },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TenantHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tenant Home</Text>
      <Text>Welcome, tenant! This is your dashboard.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, marginBottom: 8 },
});

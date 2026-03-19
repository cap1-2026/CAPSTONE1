import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

interface Message {
  id: number;
  booking_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  sender_name: string;
  created_at: string;
}

export default function OwnerMessagesPage() {
  const router = useRouter();
  const { booking_id, tenant_id, tenant_name, property_name } = useLocalSearchParams<{
    booking_id: string; tenant_id: string; tenant_name: string; property_name: string;
  }>();

  const [messages, setMessages]   = useState<Message[]>([]);
  const [text, setText]           = useState("");
  const [userId, setUserId]       = useState<number | null>(null);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_MESSAGES}?booking_id=${booking_id}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") {
        setMessages(data.data ?? []);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
      }
    } catch { }
    finally { setLoading(false); }
  }, [booking_id]);

  useEffect(() => {
    UserStorage.getUser("owner").then((user) => {
      if (user) setUserId(user.user_id);
    });
    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchMessages]);

  async function sendMessage() {
    if (!text.trim() || !userId) return;
    setSending(true);
    const msg = text.trim();
    setText("");
    try {
      await fetch(API_ENDPOINTS.SEND_MESSAGE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: Number(booking_id),
          sender_id: userId,
          receiver_id: Number(tenant_id),
          message: msg,
        }),
      });
      fetchMessages();
    } catch { setText(msg); }
    finally { setSending(false); }
  }

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{tenant_name || "Tenant"}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{property_name || "Property Chat"}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1D4ED8" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No messages yet.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isOwn = item.sender_id === userId;
              return (
                <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
                  {!isOwn && (
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{(tenant_name || "T")[0].toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleTheirs]}>
                    {!isOwn && <Text style={styles.senderName}>{item.sender_name || tenant_name || "Tenant"}</Text>}
                    <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{item.message}</Text>
                    <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>{formatTime(item.created_at)}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input Row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#F8FAFC" },
  header:       { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  backBtn:      { marginRight: 10, padding: 4 },
  headerTitle:  { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  headerSub:    { fontSize: 11, color: "#64748B", marginTop: 1 },
  center:       { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent:  { padding: 14, paddingBottom: 8, flexGrow: 1 },
  emptyMessages:{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 10 },
  emptyText:    { fontSize: 14, color: "#94A3B8" },

  bubbleRow:    { flexDirection: "row", alignItems: "flex-end", marginBottom: 8, gap: 8 },
  bubbleRowOwn: { flexDirection: "row-reverse" },
  avatarCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center" },
  avatarText:   { fontSize: 12, fontWeight: "700", color: "#D97706" },
  bubble:       { maxWidth: "75%", borderRadius: 16, padding: 10, paddingHorizontal: 14 },
  bubbleOwn:    { backgroundColor: "#1D4ED8", borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: "#E2E8F0", borderBottomLeftRadius: 4 },
  senderName:   { fontSize: 10, fontWeight: "700", color: "#D97706", marginBottom: 2 },
  bubbleText:   { fontSize: 14, color: "#1E293B", lineHeight: 20 },
  bubbleTextOwn:{ color: "#fff" },
  bubbleTime:   { fontSize: 10, color: "#94A3B8", marginTop: 4, textAlign: "right" },
  bubbleTimeOwn:{ color: "rgba(255,255,255,0.6)" },

  inputRow:         { flexDirection: "row", alignItems: "flex-end", padding: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E2E8F0", gap: 8 },
  input:            { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: "#F1F5F9", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#0F172A" },
  sendBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center" },
  sendBtnDisabled:  { backgroundColor: "#94A3B8" },
});

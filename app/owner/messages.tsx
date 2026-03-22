import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  booking_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  sender_name: string;
  created_at: string;
  is_read?: number;
}

interface OptimisticMsg {
  id: string;           // "opt_<timestamp>"
  booking_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  sender_name: string;
  created_at: string;
  is_read: number;
  status: "sending" | "failed";
}

type AnyMsg = Message | OptimisticMsg;

type ListItem =
  | { type: "date";    key: string; label: string }
  | { type: "message"; key: string; msg: AnyMsg; isFirst: boolean; isLast: boolean; isOwn: boolean };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getDateLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (dayKey(d) === dayKey(now))   return "Today";
  if (dayKey(d) === dayKey(yest))  return "Yesterday";
  return d.toLocaleDateString("en-PH", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

function isOpt(m: AnyMsg): m is OptimisticMsg {
  return typeof m.id === "string";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function OwnerMessagesPage() {
  const router = useRouter();
  const { booking_id, tenant_id, tenant_name, property_name } = useLocalSearchParams<{
    booking_id: string;
    tenant_id: string;
    tenant_name: string;
    property_name: string;
  }>();

  const [serverMsgs, setServerMsgs]   = useState<Message[]>([]);
  const [optimistic, setOptimistic]   = useState<OptimisticMsg[]>([]);
  const [text, setText]               = useState("");
  const [userId, setUserId]           = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);
  const [unreadBadge, setUnreadBadge] = useState(0);

  const listRef      = useRef<FlatList<ListItem>>(null);
  const pollingRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef    = useRef<number | null>(null);
  const prevCountRef = useRef(0);

  // ── Mark messages as read ────────────────────────────────────────────────
  const markRead = useCallback(async (uid: number) => {
    try {
      await fetch(API_ENDPOINTS.MARK_READ, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: Number(booking_id), reader_id: uid }),
      });
    } catch {}
  }, [booking_id]);

  // ── Fetch messages ────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const res  = await fetch(`${API_ENDPOINTS.GET_MESSAGES}?booking_id=${booking_id}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") {
        const msgs: Message[] = data.data ?? [];
        setServerMsgs(msgs);

        // Prune optimistic msgs whose text has appeared on server
        const lastTexts = new Set(msgs.slice(-20).map((m) => m.message));
        setOptimistic((prev) =>
          prev.filter((m) => m.status === "failed" || !lastTexts.has(m.message))
        );

        // Unread count for badge
        if (userIdRef.current) {
          const unread = msgs.filter(
            (m) => m.receiver_id === userIdRef.current && !m.is_read
          );
          setUnreadBadge(unread.length);
          if (unread.length > 0) markRead(userIdRef.current);
        }

        // Haptic on new incoming message
        const diff = msgs.length - prevCountRef.current;
        if (diff > 0 && prevCountRef.current > 0) {
          const lastNew = msgs[msgs.length - 1];
          if (lastNew.sender_id !== userIdRef.current) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
        prevCountRef.current = msgs.length;

        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      }
    } catch {}
    finally { setLoading(false); }
  }, [booking_id, markRead]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    UserStorage.getUser("owner").then((user) => {
      if (user) {
        setUserId(user.user_id);
        userIdRef.current = user.user_id;
      }
    });
    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 2000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchMessages]);

  // ── Build flat list with date separators + grouped bubbles ────────────────
  const allMsgs = useMemo<AnyMsg[]>(
    () => [...serverMsgs, ...optimistic],
    [serverMsgs, optimistic]
  );

  const listItems = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    let curDate = "";

    allMsgs.forEach((msg, idx) => {
      const dateLabel = getDateLabel(msg.created_at);
      if (dateLabel && dateLabel !== curDate) {
        curDate = dateLabel;
        items.push({ type: "date", key: `d_${dateLabel}_${idx}`, label: dateLabel });
      }

      const prev = allMsgs[idx - 1];
      const next = allMsgs[idx + 1];
      const prevDate = prev ? getDateLabel(prev.created_at) : "";
      const nextDate = next ? getDateLabel(next.created_at) : "";

      items.push({
        type:    "message",
        key:     `m_${msg.id}`,
        msg,
        isFirst: !prev || prev.sender_id !== msg.sender_id || prevDate !== dateLabel,
        isLast:  !next || next.sender_id !== msg.sender_id || nextDate !== dateLabel,
        isOwn:   msg.sender_id === userId,
      });
    });

    return items;
  }, [allMsgs, userId]);

  // ── Send ──────────────────────────────────────────────────────────────────
  async function sendMessage(forceMsg?: string) {
    const raw = (typeof forceMsg === "string" ? forceMsg : text).trim();
    if (!raw) return;

    // Resolve user ID — use ref first, then state, then load fresh from storage
    let uid = userIdRef.current ?? userId;
    if (!uid) {
      const freshUser = await UserStorage.getUser("owner");
      if (freshUser) {
        uid = freshUser.user_id;
        setUserId(uid);
        userIdRef.current = uid;
      }
    }
    if (!uid) return;

    if (typeof forceMsg !== "string") setText("");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const tempId = `opt_${Date.now()}`;
    const temp: OptimisticMsg = {
      id:           tempId,
      booking_id:   Number(booking_id),
      sender_id:    uid,
      receiver_id:  Number(tenant_id),
      message:      raw,
      sender_name:  "You",
      created_at:   new Date().toISOString(),
      is_read:      0,
      status:       "sending",
    };

    setOptimistic((prev) => [...prev, temp]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const res  = await fetch(API_ENDPOINTS.SEND_MESSAGE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id:  Number(booking_id),
          sender_id:   uid,
          receiver_id: Number(tenant_id),
          message:     raw,
        }),
      });
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.message ?? "Send failed");
      fetchMessages();
    } catch {
      // Mark as failed — user can tap "retry" to resend
      setOptimistic((prev) =>
        prev.map((m) => m.id === tempId ? { ...m, status: "failed" } : m)
      );
    }
  }

  function retryFailed(opt: OptimisticMsg) {
    setOptimistic((prev) => prev.filter((m) => m.id !== opt.id));
    sendMessage(opt.message);
  }

  // ── Render bubble ─────────────────────────────────────────────────────────
  function renderItem({ item }: { item: ListItem }) {
    if (item.type === "date") {
      return (
        <View style={S.dateSep}>
          <View style={S.dateLine} />
          <Text style={S.dateLabel}>{item.label}</Text>
          <View style={S.dateLine} />
        </View>
      );
    }

    const { msg, isFirst, isLast, isOwn } = item;
    const opt         = isOpt(msg);
    const isFailed    = opt && msg.status === "failed";
    const isSending   = opt && msg.status === "sending";
    const isRead      = !opt && !!(msg as Message).is_read;

    // Dynamic border radius for grouped bubbles
    const br = {
      borderTopLeftRadius:     isOwn ? 18 : (isFirst ? 18 : 5),
      borderTopRightRadius:    isOwn ? (isFirst ? 18 : 5) : 18,
      borderBottomLeftRadius:  isOwn ? 18 : (isLast ? 5 : 18),
      borderBottomRightRadius: isOwn ? (isLast ? 5 : 18) : 18,
    };

    return (
      <View style={[S.row, isOwn && S.rowOwn, !isFirst && S.rowGrouped]}>
        {/* Avatar (others only, invisible on non-last to preserve spacing) */}
        {!isOwn && (
          <View style={[S.avatar, { opacity: isLast ? 1 : 0 }]}>
            <Text style={S.avatarTxt}>{(tenant_name || "T")[0].toUpperCase()}</Text>
          </View>
        )}

        <View style={S.bubbleCol}>
          {/* Sender name on first bubble of a group */}
          {!isOwn && isFirst && (
            <Text style={S.senderName}>
              {msg.sender_name || tenant_name || "Tenant"}
            </Text>
          )}

          {/* Bubble */}
          <View style={[
            S.bubble,
            isOwn ? S.bubbleOwn : S.bubbleTheirs,
            br,
            isFailed && S.bubbleFailed,
          ]}>
            <Text style={[S.msgTxt, isOwn && S.msgTxtOwn]}>{msg.message}</Text>

            {/* Time + status row (only on last bubble in group) */}
            {isLast && (
              <View style={S.timeRow}>
                <Text style={[S.timeTxt, isOwn && S.timeTxtOwn]}>
                  {formatTime(msg.created_at)}
                </Text>
                {isOwn && (
                  <View style={S.tick}>
                    {isSending ? (
                      <Ionicons name="time-outline"  size={10} color="rgba(255,255,255,0.5)" />
                    ) : isFailed ? (
                      <Ionicons name="alert-circle"  size={12} color="#EF4444" />
                    ) : isRead ? (
                      <Text style={[S.tickTxt, S.tickRead]}>✓✓</Text>
                    ) : (
                      <Text style={[S.tickTxt, S.tickSent]}>✓</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Retry button for failed messages */}
          {isFailed && isLast && (
            <TouchableOpacity
              style={S.retryBtn}
              onPress={() => retryFailed(msg as OptimisticMsg)}
            >
              <Ionicons name="refresh-circle" size={14} color="#EF4444" />
              <Text style={S.retryTxt}>Tap to retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const charLeft    = 500 - text.length;
  const nearLimit   = text.length > 400;
  const overLimit   = text.length >= 500;

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={S.container} edges={["top"]}>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={S.headerAvatarWrap}>
          <View style={S.headerAvatar}>
            <Text style={S.headerAvatarTxt}>{(tenant_name || "T")[0].toUpperCase()}</Text>
          </View>
          <View style={S.onlineDot} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={S.headerName} numberOfLines={1}>{tenant_name || "Tenant"}</Text>
          <Text style={S.headerSub}  numberOfLines={1}>{property_name || "Property Chat"}</Text>
        </View>

        {unreadBadge > 0 && (
          <View style={S.badge}>
            <Text style={S.badgeTxt}>{unreadBadge}</Text>
          </View>
        )}
      </View>

      {/* ─── Body ───────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {loading ? (
          <View style={S.center}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={S.loadingTxt}>Loading messages…</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={listItems}
            keyExtractor={(item) => item.key}
            contentContainerStyle={S.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            keyboardDismissMode="on-drag"
            ListEmptyComponent={
              <View style={S.empty}>
                <View style={S.emptyIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={44} color="#CBD5E1" />
                </View>
                <Text style={S.emptyTitle}>No messages yet</Text>
                <Text style={S.emptySubtitle}>Start the conversation with your tenant!</Text>
              </View>
            }
            renderItem={renderItem}
          />
        )}

        {/* ─── Input area ─────────────────────────────────────────── */}
        <View style={S.inputArea}>
          {nearLimit && (
            <Text style={[S.charCount, overLimit && S.charCountOver]}>
              {charLeft} / 500
            </Text>
          )}
          <View style={S.inputRow}>
            <TextInput
              style={S.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message…"
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[S.sendBtn, (!text.trim()) && S.sendBtnOff]}
              onPress={sendMessage}
              disabled={!text.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FA" },

  // Header
  header:          { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 10 },
  backBtn:         { padding: 6 },
  headerAvatarWrap:{ position: "relative" },
  headerAvatar:    { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FDE68A", alignItems: "center", justifyContent: "center" },
  headerAvatarTxt: { fontSize: 17, fontWeight: "800", color: "#B45309" },
  onlineDot:       { position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: "#22C55E", borderWidth: 2, borderColor: "#fff" },
  headerName:      { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  headerSub:       { fontSize: 11, color: "#64748B", marginTop: 1 },
  badge:           { backgroundColor: "#EF4444", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeTxt:        { color: "#fff", fontSize: 11, fontWeight: "700" },

  // List
  center:          { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingTxt:      { color: "#94A3B8", marginTop: 10, fontSize: 13 },
  listContent:     { padding: 12, paddingBottom: 6, flexGrow: 1 },

  // Date separator
  dateSep:         { flexDirection: "row", alignItems: "center", marginVertical: 14, gap: 8 },
  dateLine:        { flex: 1, height: 1, backgroundColor: "#D1D5DB" },
  dateLabel:       { fontSize: 11, color: "#9CA3AF", fontWeight: "600", paddingHorizontal: 6, backgroundColor: "#EEF2FA", borderRadius: 8 },

  // Empty state
  empty:           { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyIconWrap:   { width: 84, height: 84, borderRadius: 42, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle:      { fontSize: 16, fontWeight: "700", color: "#475569", marginBottom: 4 },
  emptySubtitle:   { fontSize: 13, color: "#94A3B8", textAlign: "center", paddingHorizontal: 32 },

  // Bubble row
  row:          { flexDirection: "row", alignItems: "flex-end", marginBottom: 3, gap: 6 },
  rowOwn:       { flexDirection: "row-reverse" },
  rowGrouped:   { marginBottom: 1 },
  avatar:       { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarTxt:    { fontSize: 13, fontWeight: "700", color: "#D97706" },
  bubbleCol:    { maxWidth: "75%" },
  senderName:   { fontSize: 10, fontWeight: "700", color: "#D97706", marginBottom: 2, marginLeft: 2 },

  bubble:       { paddingVertical: 8, paddingHorizontal: 13 },
  bubbleOwn:    { backgroundColor: "#2563EB" },
  bubbleTheirs: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  bubbleFailed: { backgroundColor: "#FEE2E2" },
  msgTxt:       { fontSize: 14, color: "#1E293B", lineHeight: 20 },
  msgTxtOwn:    { color: "#fff" },

  timeRow:      { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 3 },
  timeTxt:      { fontSize: 10, color: "#94A3B8" },
  timeTxtOwn:   { color: "rgba(255,255,255,0.55)" },
  tick:         { alignItems: "center", justifyContent: "center" },
  tickTxt:      { fontSize: 11, fontWeight: "700" },
  tickRead:     { color: "#93C5FD" },
  tickSent:     { color: "rgba(255,255,255,0.55)" },

  retryBtn:     { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3, marginLeft: 2 },
  retryTxt:     { fontSize: 11, color: "#EF4444" },

  // Input
  inputArea:       { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  charCount:       { fontSize: 11, color: "#64748B", textAlign: "right", paddingRight: 16, paddingTop: 5 },
  charCountOver:   { color: "#EF4444" },
  inputRow:        { flexDirection: "row", alignItems: "flex-end", padding: 10, gap: 8 },
  input:           { flex: 1, minHeight: 42, maxHeight: 120, backgroundColor: "#F1F5F9", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#0F172A" },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  sendBtnOff:      { backgroundColor: "#94A3B8" },
});

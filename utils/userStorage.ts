// ============================================================
//  PadFinder – UserStorage utility
//  Each role (owner / tenant / admin) gets its own storage key
//  so logging in as admin in one tab never overwrites the
//  owner or tenant session in another tab.
//
//  On web: window.localStorage.  On native: AsyncStorage.
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface StoredUser {
  user_id: number;
  email:   string;
  fullname: string;
  role:    "owner" | "tenant" | "admin";
  contact?: string;
  address?: string;
}

// One key per role — tabs never collide
const roleKey  = (role: string) => `@padfinder_user_${role}`;
// Legacy single key kept only for index.tsx auto-redirect convenience
const LEGACY_KEY = "@padfinder_user";

const isWeb = Platform.OS === "web" && typeof window !== "undefined";

function webGet(key: string): string | null {
  return window.localStorage.getItem(key);
}
function webSet(key: string, val: string): void {
  window.localStorage.setItem(key, val);
}
function webRemove(key: string): void {
  window.localStorage.removeItem(key);
}

export const UserStorage = {
  /** Save a user session. Writes to the role-specific key so concurrent
   *  tabs (owner, tenant, admin) never overwrite each other. */
  async saveUser(user: StoredUser): Promise<void> {
    const json = JSON.stringify(user);
    if (isWeb) {
      webSet(roleKey(user.role), json);
      webSet(LEGACY_KEY, json); // kept so index.tsx auto-redirect still works
    } else {
      await AsyncStorage.setItem(roleKey(user.role), json);
      await AsyncStorage.setItem(LEGACY_KEY, json);
    }
  },

  /** Get a stored user.
   *  - Pass `role` ("owner" | "tenant" | "admin") to read that role's
   *    isolated session — this is what layouts and role-specific pages
   *    should always do.
   *  - Omit `role` to fall back to the legacy single key (index.tsx).
   *
   *  Migration: if the role-specific key is empty but the legacy key
   *  holds a matching role, the data is migrated automatically so the
   *  user isn't logged out after the upgrade. */
  async getUser(role?: string): Promise<StoredUser | null> {
    try {
      if (role) {
        const key = roleKey(role);
        // 1. Try the role-specific key first
        const raw = isWeb ? webGet(key) : await AsyncStorage.getItem(key);
        if (raw) return JSON.parse(raw) as StoredUser;

        // 2. Fall back to legacy key and migrate if role matches
        const legacyRaw = isWeb ? webGet(LEGACY_KEY) : await AsyncStorage.getItem(LEGACY_KEY);
        if (legacyRaw) {
          const legacyUser = JSON.parse(legacyRaw) as StoredUser;
          if (legacyUser.role === role) {
            // Migrate: write to role-specific key so next read is instant
            if (isWeb) webSet(key, legacyRaw);
            else await AsyncStorage.setItem(key, legacyRaw);
            return legacyUser;
          }
        }
        return null;
      }

      // No role specified — read legacy key (index.tsx auto-redirect)
      const raw = isWeb ? webGet(LEGACY_KEY) : await AsyncStorage.getItem(LEGACY_KEY);
      return raw ? (JSON.parse(raw) as StoredUser) : null;
    } catch {
      return null;
    }
  },

  /** Clear a stored session.
   *  Pass `role` to only clear that role's key (plus the legacy key).
   *  Omit to clear only the legacy key. */
  async clearUser(role?: string): Promise<void> {
    if (isWeb) {
      if (role) webRemove(roleKey(role));
      webRemove(LEGACY_KEY);
    } else {
      if (role) await AsyncStorage.removeItem(roleKey(role));
      await AsyncStorage.removeItem(LEGACY_KEY);
    }
  },
};

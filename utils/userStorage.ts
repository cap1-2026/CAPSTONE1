// ============================================================
//  PadFinder – UserStorage utility
//  On web: uses window.localStorage directly (persists across refresh).
//  On native: uses AsyncStorage.
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface StoredUser {
  user_id: number;
  email:   string;
  fullname: string;
  role:    "owner" | "tenant" | "admin";
}

const USER_KEY = "@padfinder_user";
const isWeb = Platform.OS === "web" && typeof window !== "undefined";

export const UserStorage = {
  async saveUser(user: StoredUser): Promise<void> {
    const json = JSON.stringify(user);
    if (isWeb) {
      window.localStorage.setItem(USER_KEY, json);
    } else {
      await AsyncStorage.setItem(USER_KEY, json);
    }
  },

  async getUser(): Promise<StoredUser | null> {
    try {
      if (isWeb) {
        const raw = window.localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as StoredUser) : null;
      }
      const raw = await AsyncStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as StoredUser) : null;
    } catch {
      return null;
    }
  },

  async clearUser(): Promise<void> {
    if (isWeb) {
      window.localStorage.removeItem(USER_KEY);
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }
  },
};

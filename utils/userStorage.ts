// ============================================================
//  PadFinder – UserStorage utility
//  Persists the logged-in user to AsyncStorage so every screen
//  can call UserStorage.getUser() without prop-drilling.
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface StoredUser {
  user_id: number;
  email:   string;
  fullname: string;
  role:    "owner" | "tenant";
}

const USER_KEY = "@padfinder_user";

export const UserStorage = {
  /** Save user after successful login. */
  async saveUser(user: StoredUser): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /** Retrieve the currently logged-in user, or null if none. */
  async getUser(): Promise<StoredUser | null> {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as StoredUser) : null;
    } catch {
      return null;
    }
  },

  /** Clear stored user on logout. */
  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },
};
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@user_session';

export interface UserSession {
  user_id: number;
  email: string;
  fullname: string;
  role: 'owner' | 'tenant';
}

export const UserStorage = {
  // Save user session
  async saveUser(user: UserSession): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      console.log('User session saved:', user);
    } catch (error) {
      console.error('Error saving user session:', error);
      throw error;
    }
  },

  // Get user session
  async getUser(): Promise<UserSession | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (userJson) {
        const user = JSON.parse(userJson);
        console.log('User session retrieved:', user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  },

  // Clear user session (logout)
  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
      console.log('User session cleared');
    } catch (error) {
      console.error('Error clearing user session:', error);
      throw error;
    }
  },

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    const user = await this.getUser();
    return user !== null;
  },

  // Update user info
  async updateUser(updates: Partial<UserSession>): Promise<void> {
    const currentUser = await this.getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      await this.saveUser(updatedUser);
    }
  }
};

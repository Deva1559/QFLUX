import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const inMemoryFallback = new Map<string, string>();

/**
 * Robust Cross-Platform Secure Storage Adapter:
 * - Uses expo-secure-store (Android KeyStore / iOS Keychain) on native mobile devices.
 * - Gracefully falls back to browser localStorage on web.
 * - Provides memory fallback if persistent storage is unavailable.
 */
export const storage = {
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
          return;
        }
      } else {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          await SecureStore.setItemAsync(key, value, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
          });
          return;
        }
      }
    } catch {
      // Fallback on error
    }
    inMemoryFallback.set(key, value);
  },

  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
      } else {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          return await SecureStore.getItemAsync(key);
        }
      }
    } catch {
      // Fallback on error
    }
    return inMemoryFallback.get(key) || null;
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
          return;
        }
      } else {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          await SecureStore.deleteItemAsync(key);
          return;
        }
      }
    } catch {
      // Fallback on error
    }
    inMemoryFallback.delete(key);
  }
};

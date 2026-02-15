/**
 * Storage.ts
 * Respectlytics React Native SDK
 *
 * Wrapper around AsyncStorage for persisting SDK data.
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage wrapper providing typed access to AsyncStorage
 */
export class Storage {
  /**
   * Get a string value from storage
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.log(`[Respectlytics] Failed to read from storage: ${key}`);
      return null;
    }
  }

  /**
   * Set a string value in storage
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.log(`[Respectlytics] Failed to write to storage: ${key}`);
    }
  }

  /**
   * Remove a value from storage
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log(`[Respectlytics] Failed to remove from storage: ${key}`);
    }
  }
}

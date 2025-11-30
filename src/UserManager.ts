/**
 * UserManager.ts
 * Respectlytics React Native SDK
 *
 * Manages user ID generation, persistence, and reset.
 * User IDs are auto-generated and cannot be overridden.
 * This is by design for maximum privacy.
 *
 * Copyright (c) 2025 Respectlytics. All rights reserved.
 */

import { Storage } from './Storage';
import { STORAGE_KEYS } from './types';

/**
 * Manages user ID generation, persistence, and reset
 */
export class UserManager {
  private _userId: string | null = null;

  /**
   * Current user ID (null if not identified)
   */
  getUserId(): string | null {
    return this._userId;
  }

  /**
   * Load any persisted user ID from storage
   */
  async loadUserId(): Promise<void> {
    this._userId = await Storage.getItem(STORAGE_KEYS.USER_ID);
  }

  /**
   * Generate or retrieve user ID.
   * If already identified, returns existing ID.
   * If not, generates a new ID and persists it.
   */
  async identify(): Promise<void> {
    // Check storage first
    const stored = await Storage.getItem(STORAGE_KEYS.USER_ID);
    if (stored) {
      this._userId = stored;
      return;
    }

    // Generate new ID (32 lowercase hex chars)
    const newId = this.generateUserId();
    await Storage.setItem(STORAGE_KEYS.USER_ID, newId);
    this._userId = newId;
  }

  /**
   * Clear user ID. Call on logout.
   */
  async reset(): Promise<void> {
    await Storage.removeItem(STORAGE_KEYS.USER_ID);
    this._userId = null;
  }

  /**
   * Generate a new user ID (32 lowercase hex characters)
   * UUID without dashes, all lowercase
   */
  private generateUserId(): string {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    return uuid.toLowerCase().replace(/-/g, '');
  }
}

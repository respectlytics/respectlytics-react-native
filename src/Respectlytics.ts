/**
 * Respectlytics.ts
 * Respectlytics React Native SDK
 * 
 * Main entry point for the SDK.
 * Copyright (c) 2025 Respectlytics. All rights reserved.
 */

import { Platform, Dimensions, NativeModules } from 'react-native';
import { Event } from './types';
import { SessionManager } from './SessionManager';
import { UserManager } from './UserManager';
import { NetworkClient } from './NetworkClient';
import { EventQueue } from './EventQueue';

/**
 * Main entry point for the Respectlytics SDK.
 * 
 * Usage:
 * ```typescript
 * // 1. Configure at app launch
 * Respectlytics.configure('your-api-key');
 * 
 * // 2. Enable user tracking (optional)
 * Respectlytics.identify();
 * 
 * // 3. Track events
 * Respectlytics.track('purchase');
 * Respectlytics.track('view_product', 'ProductScreen');
 * ```
 */
class RespectlyticsSDK {
  private isConfigured = false;
  private networkClient: NetworkClient;
  private eventQueue: EventQueue;
  private sessionManager: SessionManager;
  private userManager: UserManager;

  constructor() {
    this.networkClient = new NetworkClient();
    this.eventQueue = new EventQueue(this.networkClient);
    this.sessionManager = new SessionManager();
    this.userManager = new UserManager();
  }

  /**
   * Initialize the SDK with your API key.
   * Call once at app startup.
   * 
   * @param apiKey Your Respectlytics API key from the dashboard
   */
  configure(apiKey: string): void {
    if (!apiKey || apiKey.trim() === '') {
      console.log('[Respectlytics] ⚠️ API key cannot be empty');
      return;
    }

    this.networkClient.configure(apiKey);
    this.eventQueue.start();
    this.userManager.loadUserId();
    this.isConfigured = true;

    console.log('[Respectlytics] ✓ SDK configured');
  }

  /**
   * Track an event with an optional screen name.
   * 
   * The SDK automatically collects privacy-safe metadata:
   * - timestamp, session_id, platform, os_version, app_version, locale
   * 
   * @param eventName Name of the event (e.g., "purchase", "button_clicked")
   * @param screen Optional screen name where the event occurred
   */
  track(eventName: string, screen?: string): void {
    if (!this.isConfigured) {
      console.log('[Respectlytics] ⚠️ SDK not configured. Call configure(apiKey) first.');
      return;
    }

    if (!eventName || eventName.trim() === '') {
      console.log('[Respectlytics] ⚠️ Event name cannot be empty');
      return;
    }

    if (eventName.length > 100) {
      console.log('[Respectlytics] ⚠️ Event name too long (max 100 characters)');
      return;
    }

    const event = this.createEvent(eventName, screen);
    this.eventQueue.add(event);
  }

  /**
   * Enable cross-session user tracking.
   * Generates and persists a random user ID that will be included in all subsequent events.
   * 
   * Note: User IDs are auto-generated and cannot be overridden. This is by design for privacy.
   */
  async identify(): Promise<void> {
    await this.userManager.identify();
    console.log('[Respectlytics] ✓ User identified');
  }

  /**
   * Clear the user ID.
   * Call when the user logs out. Subsequent events will be anonymous until identify() is called again.
   */
  async reset(): Promise<void> {
    await this.userManager.reset();
    console.log('[Respectlytics] ✓ User reset');
  }

  /**
   * Force send all queued events immediately.
   * Rarely needed - the SDK auto-flushes every 30 seconds or when the queue reaches 10 events.
   */
  async flush(): Promise<void> {
    await this.eventQueue.flush();
  }

  // MARK: - Private Helpers

  private createEvent(eventName: string, screen?: string): Event {
    const metadata = this.collectMetadata();
    
    return {
      eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionManager.getSessionId(),
      userId: this.userManager.getUserId(),
      screen: screen || null,
      ...metadata,
    };
  }

  private collectMetadata(): {
    platform: string;
    osVersion: string;
    appVersion: string;
    locale: string;
    deviceType: string;
  } {
    // Determine platform
    const platform = Platform.OS === 'ios' ? 'iOS' : 'Android';

    // Get OS version
    const osVersion = String(Platform.Version);

    // Get app version - try to get from native modules
    let appVersion = 'unknown';
    try {
      // React Native provides app info through different native modules
      const { PlatformConstants } = NativeModules;
      if (PlatformConstants?.reactNativeVersion) {
        // This is React Native version, not app version
        // App version should come from the host app
      }
      // For now, use 'unknown' as we can't reliably get app version without additional dependencies
      // In a real app, the developer would configure this
    } catch {
      appVersion = 'unknown';
    }

    // Get locale
    let locale = 'en_US';
    try {
      // React Native doesn't expose locale directly, but we can get it from platform
      if (Platform.OS === 'ios') {
        locale = NativeModules.SettingsManager?.settings?.AppleLocale || 
                 NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 
                 'en_US';
      } else {
        locale = NativeModules.I18nManager?.localeIdentifier || 'en_US';
      }
    } catch {
      locale = 'en_US';
    }

    // Determine device type based on screen size
    const { width, height } = Dimensions.get('window');
    const minDimension = Math.min(width, height);
    const deviceType = minDimension >= 600 ? 'tablet' : 'phone';

    return {
      platform,
      osVersion,
      appVersion,
      locale,
      deviceType,
    };
  }
}

// Export singleton instance
const Respectlytics = new RespectlyticsSDK();
export default Respectlytics;
export { RespectlyticsSDK };

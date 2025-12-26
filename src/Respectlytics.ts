/**
 * Respectlytics.ts
 * Respectlytics React Native SDK
 *
 * Main entry point for the SDK.
 * Copyright (c) 2025 Respectlytics. All rights reserved.
 */

import { Platform } from 'react-native';
import { Event } from './types';
import { SessionManager } from './SessionManager';
import { NetworkClient } from './NetworkClient';
import { EventQueue } from './EventQueue';

/**
 * Main entry point for the Respectlytics SDK.
 *
 * v2.1.0 uses session-based analytics only:
 * - Session IDs are generated automatically in RAM
 * - Sessions rotate every 2 hours
 * - New session on every app restart
 * - Only 4 fields sent: event_name, timestamp, session_id, platform
 *
 * Usage:
 * ```typescript
 * // 1. Configure at app launch
 * Respectlytics.configure('your-api-key');
 *
 * // 2. Track events
 * Respectlytics.track('purchase');
 * ```
 */
class RespectlyticsSDK {
  private isConfigured = false;
  private networkClient: NetworkClient;
  private eventQueue: EventQueue;
  private sessionManager: SessionManager;
  private platform: string;

  constructor() {
    this.networkClient = new NetworkClient();
    this.eventQueue = new EventQueue(this.networkClient);
    this.sessionManager = new SessionManager();
    this.platform = Platform.OS === 'ios' ? 'iOS' : 'Android';
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
    this.isConfigured = true;

    console.log('[Respectlytics] ✓ SDK configured (v2.1.0)');
  }

  /**
   * Track an event.
   *
   * Custom properties are NOT supported - this is by design for privacy.
   * The API uses a strict 4-field allowlist.
   *
   * @param eventName Name of the event (e.g., "purchase", "button_clicked")
   */
  track(eventName: string): void {
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

    const event: Event = {
      eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionManager.getSessionId(),
      platform: this.platform,
    };

    this.eventQueue.add(event);
  }

  /**
   * Force send all queued events immediately.
   * Rarely needed - the SDK auto-flushes every 30 seconds or when the queue reaches 10 events.
   */
  async flush(): Promise<void> {
    await this.eventQueue.flush();
  }
}

// Export singleton instance
const Respectlytics = new RespectlyticsSDK();
export default Respectlytics;
export { RespectlyticsSDK };

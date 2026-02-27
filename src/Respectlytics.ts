/**
 * Respectlytics.ts
 * Respectlytics React Native SDK
 *
 * Main entry point for the SDK.
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { Platform } from 'react-native';
import { Event } from './types';
import { SessionManager } from './SessionManager';
import { NetworkClient } from './NetworkClient';
import { EventQueue } from './EventQueue';

/**
 * Main entry point for the Respectlytics SDK.
 *
 * v3.0.0 uses session-based analytics only:
 * - Session IDs are generated automatically in RAM
 * - Event queue is RAM-only (zero device storage)
 * - Sessions rotate every 2 hours
 * - New session on every app restart
 * - Only 4 fields sent by SDK; 5 stored (country derived server-side)
 *
 * Usage:
 * ```typescript
 * // 1. Configure at app launch
 * Respectlytics.configure('your-api-key');
 *
 * // For self-hosted instances:
 * Respectlytics.configure('your-api-key', { apiEndpoint: 'https://your-server.com/api/v1/events/' });
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
   * @param options Optional configuration (e.g., apiEndpoint for self-hosted instances)
   */
  configure(apiKey: string, options?: { apiEndpoint?: string }): void {
    if (!apiKey || apiKey.trim() === '') {
      console.log('[Respectlytics] ⚠️ API key cannot be empty');
      return;
    }

    this.networkClient.configure(apiKey, options?.apiEndpoint);
    this.eventQueue.start();
    this.isConfigured = true;

    console.log('[Respectlytics] ✓ SDK configured (v3.0.0)');
  }

  /**
   * Track an event.
   *
   * Custom properties are NOT supported - this is by design for privacy.
   * The API stores 5 fields (these 4 plus country derived server-side).
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

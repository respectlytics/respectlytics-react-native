/**
 * Respectlytics.ts
 * Respectlytics React Native SDK
 *
 * Main entry point for the SDK.
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { Platform } from 'react-native';
import { Event, EventProperties } from './types';
import { SessionManager } from './SessionManager';
import { NetworkClient } from './NetworkClient';
import { EventQueue } from './EventQueue';
import { describeDropped, filterProperties } from './properties';
import { isDevelopmentBuild } from './environment';

/**
 * Main entry point for the Respectlytics SDK.
 *
 * v3.1.0 uses session-based analytics only:
 * - Session IDs are generated automatically in RAM
 * - Event queue is RAM-only (zero device storage)
 * - Sessions rotate every 2 hours
 * - New session on every app restart
 * - 4 fields sent by SDK; 5 stored (country derived server-side)
 * - Optional properties, filtered on the device; the server keeps only the
 *   ones declared in the app's Settings (paid plans)
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
 *
 * // With properties (declared in the app's Settings on respectlytics.com)
 * Respectlytics.track('paywall_viewed', { paywall: 'b' });
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

    console.log('[Respectlytics] ✓ SDK configured (v3.1.0)');
  }

  /**
   * Track an event.
   *
   * The API stores 5 fields (these 4 plus country derived server-side), and
   * the properties the app's owner declared in the app's Settings.
   *
   * Properties are filtered on the device with the server's rules: a name
   * must match `^[a-z][a-z0-9_]{0,39}$`; a value must be a string matching
   * `^[A-Za-z0-9][A-Za-z0-9 _.-]{0,39}$`, a finite number or a boolean; at
   * most 20 are kept. Anything else is dropped and the event is still sent.
   *
   * @param eventName Name of the event (e.g., "purchase", "button_clicked")
   * @param properties Optional properties (e.g., `{ paywall: 'b' }` or `{ price: 7.5 }`)
   */
  track(eventName: string, properties?: EventProperties): void {
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

    const kept = this.keptProperties(eventName, properties);
    if (kept) {
      event.properties = kept;
    }

    this.eventQueue.add(event);
  }

  /**
   * Force send all queued events immediately.
   * Rarely needed - the SDK auto-flushes every 30 seconds or when the queue reaches 10 events.
   */
  async flush(): Promise<void> {
    await this.eventQueue.flush();
  }

  /**
   * The properties that pass the filter, or undefined when none do.
   * Never throws: a bad property must never stop the event.
   */
  private keptProperties(eventName: string, properties: unknown): EventProperties | undefined {
    if (properties === undefined || properties === null) {
      return undefined;
    }

    try {
      const { kept, dropped } = filterProperties(properties);
      if (dropped.length > 0 && isDevelopmentBuild()) {
        console.log(describeDropped(eventName, dropped));
      }
      return Object.keys(kept).length > 0 ? kept : undefined;
    } catch {
      // Reading the object threw (a getter or a proxy): send the event without properties.
      if (isDevelopmentBuild()) {
        console.log(`[Respectlytics] ⚠️ Properties dropped from "${eventName}": they could not be read`);
      }
      return undefined;
    }
  }
}

// Export singleton instance
const Respectlytics = new RespectlyticsSDK();
export default Respectlytics;
export { RespectlyticsSDK };

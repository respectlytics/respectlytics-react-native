/**
 * EventQueue.ts
 * Respectlytics React Native SDK
 *
 * Manages event batching and automatic flushing.
 *
 * Event queue is RAM-only by design. No data is written to device storage
 * (no AsyncStorage, no files, no databases) for analytics purposes.
 * If the app is force-quit before the next flush, unsent events are lost.
 * This is a deliberate privacy-first design choice — zero bytes are written
 * to the user's device for analytics purposes.
 *
 * The SDK auto-flushes every 30 seconds, on 10 queued events, and when the
 * app enters background, so the loss window is narrow.
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Event } from './types';
import { NetworkClient, NetworkError, isNetworkError } from './NetworkClient';

const MAX_QUEUE_SIZE = 10;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds

const KEY_REFUSED_MESSAGE =
  "[Respectlytics] The app key was refused (401). Check it in your app's Settings on respectlytics.com. " +
  'No events are sent until the app starts again.';

export class EventQueue {
  private events: Event[] = [];
  private isOnline = true;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private networkClient: NetworkClient;
  private isFlushing = false;
  private unsubscribeNetInfo: (() => void) | null = null;
  private appStateSubscription: { remove: () => void } | null = null;
  // Set by a 401. No retry fixes a wrong or revoked key, and every refused
  // request counts toward the server's block of the device's address, so
  // nothing more is sent until start() runs again (configure is called).
  private keyRefused = false;

  constructor(networkClient: NetworkClient) {
    this.networkClient = networkClient;
  }

  /**
   * Initialize the queue — set up listeners and start flush timer.
   * Calling it again (configure called again) replaces the listeners and
   * sends again after a refused key.
   */
  start(): void {
    this.stop();
    this.keyRefused = false;
    this.setupNetworkMonitor();
    this.setupAppStateMonitor();
    this.scheduleFlush();
    console.log('[Respectlytics] ✓ Event queue started');
  }

  /**
   * Stop the queue and clean up resources
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Add an event to the in-memory queue.
   */
  add(event: Event): void {
    if (this.keyRefused) {
      return;
    }

    this.events.push(event);

    // Check if we should flush
    if (this.events.length >= MAX_QUEUE_SIZE) {
      this.flush();
    }
  }

  /**
   * Force flush all queued events
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.events.length === 0) {
      return;
    }

    if (!this.isOnline) {
      console.log('[Respectlytics] Offline, skipping flush');
      return;
    }

    if (!this.networkClient.isConfigured()) {
      console.log('[Respectlytics] ⚠️ SDK not configured, skipping flush');
      return;
    }

    this.isFlushing = true;

    // Take a snapshot of events to send
    const batch = [...this.events];
    this.events = [];

    // Each event is sent on its own. On a failure only the events not yet
    // sent go back to the front of the queue, so an event the server already
    // accepted is never sent twice. An event the server refused (400) counts
    // as done: NetworkClient drops it, so it never holds up the ones behind it.
    let done = 0;
    let accepted = 0;
    try {
      for (const event of batch) {
        if (await this.networkClient.sendEvent(event)) {
          accepted++;
        }
        done++;
      }
    } catch (error) {
      if (isNetworkError(error, NetworkError.Unauthorized)) {
        this.refuseKey();
      } else {
        this.events = [...batch.slice(done), ...this.events];
        console.log('[Respectlytics] Failed to send events, will retry later');
      }
    } finally {
      this.isFlushing = false;
    }

    if (accepted > 0) {
      console.log(`[Respectlytics] ✓ Sent ${accepted} event(s)`);
    }
  }

  /**
   * Get current queue size (for testing)
   */
  getQueueSize(): number {
    return this.events.length;
  }

  /**
   * True after a 401, until start() runs again.
   */
  isKeyRefused(): boolean {
    return this.keyRefused;
  }

  // MARK: - Private Helpers

  /**
   * A 401: drop every queued event, stop the timer and listeners, and say so
   * once.
   */
  private refuseKey(): void {
    this.keyRefused = true;
    this.events = [];
    this.stop();
    console.log(KEY_REFUSED_MESSAGE);
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, FLUSH_INTERVAL_MS);
  }

  private setupNetworkMonitor(): void {
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // If we just came online, try to flush
      if (wasOffline && this.isOnline) {
        console.log('[Respectlytics] Network restored, flushing queue');
        this.flush();
      }
    });
  }

  private setupAppStateMonitor(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        // Flush when app goes to background
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          this.flush();
        }
      }
    );
  }
}

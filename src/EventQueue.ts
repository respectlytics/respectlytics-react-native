/**
 * EventQueue.ts
 * Respectlytics React Native SDK
 *
 * Manages event batching, persistence, and automatic flushing.
 * Events are NEVER lost - they are persisted immediately and retried on failure.
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Event } from './types';
import { Storage } from './Storage';
import { NetworkClient } from './NetworkClient';

const MAX_QUEUE_SIZE = 10;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds
const QUEUE_STORAGE_KEY = 'com.respectlytics.eventQueue';

export class EventQueue {
  private events: Event[] = [];
  private isOnline = true;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private networkClient: NetworkClient;
  private isFlushing = false;
  private unsubscribeNetInfo: (() => void) | null = null;
  private appStateSubscription: { remove: () => void } | null = null;

  constructor(networkClient: NetworkClient) {
    this.networkClient = networkClient;
  }

  /**
   * Initialize the queue - load persisted events and set up listeners
   */
  async start(): Promise<void> {
    await this.loadPersistedQueue();
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
   * Add an event to the queue
   * CRITICAL: Events are persisted IMMEDIATELY before any async operations
   */
  async add(event: Event): Promise<void> {
    this.events.push(event);

    // IMMEDIATELY persist before any async operations
    await this.persistQueue();

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
    await this.persistQueue();

    try {
      await this.networkClient.send(batch);
      console.log(`[Respectlytics] ✓ Sent ${batch.length} event(s)`);
    } catch (error) {
      // Re-add failed events to the front of the queue
      this.events = [...batch, ...this.events];
      await this.persistQueue();
      console.log('[Respectlytics] Failed to send events, will retry later');
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Get current queue size (for testing)
   */
  getQueueSize(): number {
    return this.events.length;
  }

  // MARK: - Private Helpers

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

  private async persistQueue(): Promise<void> {
    try {
      await Storage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.log('[Respectlytics] Failed to persist queue:', error);
    }
  }

  private async loadPersistedQueue(): Promise<void> {
    try {
      const data = await Storage.getItem(QUEUE_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.events = parsed;
          console.log(`[Respectlytics] Loaded ${this.events.length} persisted event(s)`);
        }
      }
    } catch (error) {
      console.log('[Respectlytics] Failed to load persisted queue:', error);
      this.events = [];
    }
  }
}

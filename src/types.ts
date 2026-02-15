/**
 * types.ts
 * Respectlytics React Native SDK
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

/**
 * Represents an analytics event - flat structure matching API payload
 *
 * The SDK sends these 4 fields. The API stores 5 total
 * (adding country, derived server-side from IP which is immediately discarded):
 * - event_name (required)
 * - timestamp
 * - session_id
 * - platform
 *
 * Country is derived server-side from IP (which is immediately discarded).
 */
export interface Event {
  eventName: string;
  timestamp: string;
  sessionId: string;
  platform: string;
}

/**
 * Storage keys used by the SDK
 *
 * Note: Only the event queue is persisted.
 * Session IDs are RAM-only for privacy.
 */
export const STORAGE_KEYS = {
  EVENT_QUEUE: 'com.respectlytics.eventQueue',
} as const;

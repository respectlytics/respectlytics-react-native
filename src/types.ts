/**
 * types.ts
 * Respectlytics React Native SDK
 *
 * Copyright (c) 2025 Respectlytics. All rights reserved.
 * This SDK is provided under a proprietary license.
 * See LICENSE file for details.
 */

/**
 * Represents an analytics event - flat structure matching API payload
 *
 * v2.1.0: Only 4 fields are sent (strict API allowlist):
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

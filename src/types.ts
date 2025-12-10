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
 * This interface only contains fields accepted by the Respectlytics API.
 * The API uses a strict allowlist for privacy protection.
 * Custom properties are NOT supported - this is by design for privacy.
 * 
 * Note: As of v2.0.0, there is no userId field. Session-based analytics only.
 */
export interface Event {
  eventName: string;
  timestamp: string;
  sessionId: string;
  screen: string | null;
  platform: string;
  osVersion: string;
  appVersion: string;
  locale: string;
  deviceType: string;
}

/**
 * Storage keys used by the SDK
 * 
 * Note: As of v2.0.0, we only persist the event queue.
 * Session IDs are RAM-only for GDPR/ePrivacy compliance.
 */
export const STORAGE_KEYS = {
  EVENT_QUEUE: 'com.respectlytics.eventQueue',
} as const;

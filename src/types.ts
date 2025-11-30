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
 */
export interface Event {
  eventName: string;
  timestamp: string;
  sessionId: string;
  userId: string | null;
  screen: string | null;
  platform: string;
  osVersion: string;
  appVersion: string;
  locale: string;
  deviceType: string;
}

/**
 * Storage keys used by the SDK
 */
export const STORAGE_KEYS = {
  USER_ID: 'com.respectlytics.userId',
  EVENT_QUEUE: 'com.respectlytics.eventQueue',
} as const;

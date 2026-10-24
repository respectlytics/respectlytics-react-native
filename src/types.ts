/**
 * types.ts
 * Respectlytics React Native SDK
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

/**
 * A property value the SDK can send: a string from a list the app's owner
 * declared, a finite number (the server keeps only its band), or a boolean
 * (for a list declared as "true"/"false").
 */
export type EventPropertyValue = string | number | boolean;

/**
 * Properties passed to `track(eventName, properties)`.
 *
 * Only properties declared in the app's Settings on respectlytics.com are kept
 * by the server (paid plans). The SDK drops anything that cannot be kept
 * before it leaves the device, so free text is never sent.
 */
export type EventProperties = Record<string, EventPropertyValue>;

/**
 * Represents an analytics event - flat structure matching API payload
 *
 * The SDK sends these 4 fields, plus `properties` when the event has any.
 * The API stores 5 base fields
 * (adding country, derived server-side from IP which is immediately discarded):
 * - event_name (required)
 * - timestamp
 * - session_id
 * - platform
 * - properties (optional; already filtered on the device, absent when empty)
 *
 * Country is derived server-side from IP (which is immediately discarded).
 */
export interface Event {
  eventName: string;
  timestamp: string;
  sessionId: string;
  platform: string;
  properties?: EventProperties;
}

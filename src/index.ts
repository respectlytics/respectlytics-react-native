/**
 * Respectlytics React Native SDK
 *
 * Official SDK for privacy-first, session-based analytics.
 *
 * v3.1.1 Features:
 * - Session-based analytics (no persistent user tracking)
 * - RAM-only session storage (never persisted to disk)
 * - RAM-only event queue (zero device storage)
 * - Automatic 2-hour session rotation
 * - New session on every app restart
 * - Optional event properties, filtered on the device
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */
import Respectlytics from './Respectlytics';

// Default export - the main SDK instance
export default Respectlytics;

// Named exports for advanced usage
export { RespectlyticsSDK } from './Respectlytics';
export type { Event, EventProperties, EventPropertyValue } from './types';

/**
 * Respectlytics React Native SDK
 * 
 * Official SDK for privacy-first, session-based analytics.
 * 
 * v2.0.0 Features:
 * - Session-based analytics (no persistent user tracking)
 * - RAM-only session storage (GDPR/ePrivacy compliant)
 * - Automatic 2-hour session rotation
 * - New session on every app restart
 * 
 * Copyright (c) 2025 Respectlytics. All rights reserved.
 */

import Respectlytics from './Respectlytics';

// Default export - the main SDK instance
export default Respectlytics;

// Named exports for advanced usage
export { RespectlyticsSDK } from './Respectlytics';
export { Event } from './types';

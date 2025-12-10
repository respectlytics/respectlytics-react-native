/**
 * SessionManager.ts
 * Respectlytics React Native SDK
 *
 * Manages session ID generation and rotation.
 * Sessions are stored in RAM only (never persisted) for GDPR/ePrivacy compliance.
 * Sessions automatically rotate every 2 hours.
 *
 * Copyright (c) 2025 Respectlytics. All rights reserved.
 */

/**
 * Generate a UUID v4 string
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Manages session ID generation and rotation.
 * 
 * Session IDs are:
 * - Generated immediately when the SDK initializes
 * - Stored in RAM only (never persisted to AsyncStorage)
 * - Rotated automatically every 2 hours
 * - Regenerated on every app restart (new instance = new session)
 * 
 * This RAM-only approach ensures GDPR/ePrivacy compliance:
 * - No device storage = No consent required under ePrivacy Directive Article 5(3)
 * - Each app launch creates a fresh, unlinked session
 */
export class SessionManager {
  // Session ID generated immediately at class instantiation
  private sessionId: string = this.generateSessionId();
  private sessionStart: Date = new Date();

  // 2 hours in milliseconds
  private readonly SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;

  /**
   * Get current session ID, rotating if necessary.
   * Session rotates after 2 hours of continuous use.
   */
  getSessionId(): string {
    const now = new Date();
    const elapsed = now.getTime() - this.sessionStart.getTime();

    // Rotate session after 2 hours
    if (elapsed > this.SESSION_TIMEOUT_MS) {
      this.sessionId = this.generateSessionId();
      this.sessionStart = now;
    }

    return this.sessionId;
  }

  /**
   * Generate a new session ID (32 lowercase hex characters)
   * UUID without dashes, all lowercase
   */
  private generateSessionId(): string {
    return generateUUID().toLowerCase().replace(/-/g, '');
  }
}

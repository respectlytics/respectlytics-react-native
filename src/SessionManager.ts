/**
 * SessionManager.ts
 * Respectlytics React Native SDK
 *
 * Manages session ID generation and rotation.
 * Sessions automatically rotate after 30 minutes of inactivity.
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
 * Manages session ID generation and rotation
 */
export class SessionManager {
  private sessionId: string | null = null;
  private lastEventTime: number | null = null;

  // 30 minutes in milliseconds
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000;

  /**
   * Get current session ID, rotating if necessary.
   * Session rotates after 30 minutes of inactivity.
   */
  getSessionId(): string {
    const now = Date.now();

    // Check if session expired
    if (
      this.lastEventTime !== null &&
      now - this.lastEventTime > this.SESSION_TIMEOUT_MS
    ) {
      // Force new session
      this.sessionId = null;
    }

    // Generate new session if needed
    if (this.sessionId === null) {
      this.sessionId = this.generateSessionId();
    }

    this.lastEventTime = now;
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

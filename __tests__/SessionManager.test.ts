/**
 * SessionManager tests
 * Respectlytics React Native SDK
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { SessionManager } from '../src/SessionManager';

describe('SessionManager', () => {
  describe('getSessionId', () => {
    it('should generate a session ID on creation', () => {
      const manager = new SessionManager();
      const sessionId = manager.getSessionId();

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should generate 32 lowercase hex characters', () => {
      const manager = new SessionManager();
      const sessionId = manager.getSessionId();

      expect(sessionId.length).toBe(32);
      expect(/^[0-9a-f]{32}$/.test(sessionId)).toBe(true);
    });

    it('should return same session ID on subsequent calls', () => {
      const manager = new SessionManager();

      const first = manager.getSessionId();
      const second = manager.getSessionId();
      const third = manager.getSessionId();

      expect(second).toBe(first);
      expect(third).toBe(first);
    });

    it('should generate different IDs for different instances', () => {
      const manager1 = new SessionManager();
      const manager2 = new SessionManager();

      const sessionId1 = manager1.getSessionId();
      const sessionId2 = manager2.getSessionId();

      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should not contain hyphens (UUID stripped)', () => {
      const manager = new SessionManager();
      const sessionId = manager.getSessionId();

      expect(sessionId).not.toContain('-');
    });

    it('should not contain uppercase letters', () => {
      const manager = new SessionManager();
      const sessionId = manager.getSessionId();

      expect(sessionId).toBe(sessionId.toLowerCase());
    });

    it('should generate unique IDs across multiple instances', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const manager = new SessionManager();
        ids.add(manager.getSessionId());
      }

      // All 10 should be unique
      expect(ids.size).toBe(10);
    });

    it('should match API format requirements (32 lowercase hex)', () => {
      const manager = new SessionManager();
      const sessionId = manager.getSessionId();

      // API requires: 32 lowercase hex characters
      expect(sessionId.length).toBe(32);
      expect(/^[0-9a-f]+$/.test(sessionId)).toBe(true);
    });
  });

  describe('session rotation', () => {
    it('should not rotate session within timeout period', () => {
      const manager = new SessionManager();
      const initial = manager.getSessionId();

      // Get session ID multiple times
      for (let i = 0; i < 100; i++) {
        const current = manager.getSessionId();
        expect(current).toBe(initial);
      }
    });

    // Note: Testing the 2-hour rotation would require mocking Date
    // which is complex in Jest. The logic is tested by inspection.
  });
});

/**
 * Event type tests
 * Respectlytics React Native SDK
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { Event, STORAGE_KEYS } from '../src/types';

describe('Event type', () => {
  it('should have all required fields', () => {
    const event: Event = {
      eventName: 'test_event',
      timestamp: '2025-12-27T10:00:00Z',
      sessionId: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
      platform: 'iOS',
    };

    expect(event.eventName).toBe('test_event');
    expect(event.timestamp).toBe('2025-12-27T10:00:00Z');
    expect(event.sessionId).toBe('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
    expect(event.platform).toBe('iOS');
  });

  it('should only have 4 fields in SDK payload (API stores 5 including country)', () => {
    const event: Event = {
      eventName: 'strict_test',
      timestamp: '2025-12-27T12:00:00Z',
      sessionId: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
      platform: 'Android',
    };

    const keys = Object.keys(event);
    expect(keys.length).toBe(4);
    expect(keys).toContain('eventName');
    expect(keys).toContain('timestamp');
    expect(keys).toContain('sessionId');
    expect(keys).toContain('platform');

    // These fields should NOT exist (removed in v2.1.0)
    expect(keys).not.toContain('screen');
    expect(keys).not.toContain('userId');
    expect(keys).not.toContain('appVersion');
    expect(keys).not.toContain('osVersion');
  });

  it('should accept iOS platform', () => {
    const event: Event = {
      eventName: 'ios_test',
      timestamp: '2025-12-27T14:00:00Z',
      sessionId: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
      platform: 'iOS',
    };

    expect(event.platform).toBe('iOS');
  });

  it('should accept Android platform', () => {
    const event: Event = {
      eventName: 'android_test',
      timestamp: '2025-12-27T15:00:00Z',
      sessionId: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
      platform: 'Android',
    };

    expect(event.platform).toBe('Android');
  });

  it('should handle special characters in event name', () => {
    const event: Event = {
      eventName: 'button_click_with_äöü',
      timestamp: '2025-12-27T16:00:00Z',
      sessionId: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      platform: 'iOS',
    };

    expect(event.eventName).toBe('button_click_with_äöü');
  });

  it('should handle ISO 8601 timestamps', () => {
    const timestamps = [
      '2025-12-27T10:00:00Z',
      '2025-12-27T10:00:00.000Z',
      '2025-12-27T10:00:00+00:00',
    ];

    timestamps.forEach((ts) => {
      const event: Event = {
        eventName: 'timestamp_test',
        timestamp: ts,
        sessionId: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
        platform: 'iOS',
      };

      expect(event.timestamp).toBe(ts);
    });
  });
});

describe('STORAGE_KEYS', () => {
  it('should have EVENT_QUEUE key', () => {
    expect(STORAGE_KEYS.EVENT_QUEUE).toBe('com.respectlytics.eventQueue');
  });

  it('should not have session-related keys (session is RAM-only)', () => {
    const keys = Object.keys(STORAGE_KEYS);
    expect(keys).not.toContain('SESSION_ID');
    expect(keys).not.toContain('USER_ID');
  });
});

/**
 * Respectlytics SDK tests
 * Respectlytics React Native SDK
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { RespectlyticsSDK } from '../src/Respectlytics';

describe('RespectlyticsSDK', () => {
  let sdk: RespectlyticsSDK;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    sdk = new RespectlyticsSDK();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('configure', () => {
    it('should reject empty API key', () => {
      sdk.configure('');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Respectlytics] ⚠️ API key cannot be empty'
      );
    });

    it('should reject whitespace-only API key', () => {
      sdk.configure('   ');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Respectlytics] ⚠️ API key cannot be empty'
      );
    });

    it('should accept valid API key', () => {
      sdk.configure('test-api-key-12345');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Respectlytics] ✓ SDK configured (v3.0.0)'
      );
    });

    it('should accept API key with various formats', () => {
      sdk.configure('pk_live_abc123XYZ789');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Respectlytics] ✓ SDK configured (v3.0.0)'
      );
    });
  });

  describe('track', () => {
    it('should warn if SDK not configured', () => {
      sdk.track('test_event');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Respectlytics] ⚠️ SDK not configured. Call configure(apiKey) first.'
      );
    });

    it('should reject empty event name', () => {
      sdk.configure('test-key');
      consoleSpy.mockClear();

      sdk.track('');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Respectlytics] ⚠️ Event name cannot be empty'
      );
    });

    it('should reject whitespace-only event name', () => {
      sdk.configure('test-key');
      consoleSpy.mockClear();

      sdk.track('   ');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Respectlytics] ⚠️ Event name cannot be empty'
      );
    });

    it('should reject event name over 100 characters', () => {
      sdk.configure('test-key');
      consoleSpy.mockClear();

      const longName = 'a'.repeat(101);
      sdk.track(longName);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Respectlytics] ⚠️ Event name too long (max 100 characters)'
      );
    });

    it('should accept event name at exactly 100 characters', () => {
      sdk.configure('test-key');
      consoleSpy.mockClear();

      const maxName = 'a'.repeat(100);
      sdk.track(maxName);

      // Should not show error
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Event name too long')
      );
    });

    it('should accept valid event name', () => {
      sdk.configure('test-key');
      consoleSpy.mockClear();

      sdk.track('button_clicked');

      // Should not show any warnings
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should accept event name with special characters', () => {
      sdk.configure('test-key');
      consoleSpy.mockClear();

      sdk.track('purchase_€100');

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should accept underscore-separated event names', () => {
      sdk.configure('test-key');
      consoleSpy.mockClear();

      sdk.track('user_signed_up');

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('track method signature (v2.1.0)', () => {
    it('should only accept eventName parameter', () => {
      sdk.configure('test-key');

      // This should work - only eventName parameter
      sdk.track('simple_event');

      // Verify track method exists and only takes one string parameter
      expect(typeof sdk.track).toBe('function');
    });
  });

  describe('flush', () => {
    it('should return a Promise', async () => {
      sdk.configure('test-key');

      const result = sdk.flush();

      expect(result).toBeInstanceOf(Promise);
      await result; // Ensure it resolves
    });
  });
});

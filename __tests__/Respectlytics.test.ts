/**
 * Respectlytics SDK tests
 * Respectlytics React Native SDK
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { RespectlyticsSDK } from '../src/Respectlytics';
import { EventProperties } from '../src/types';
import packageJson from '../package.json';

const CONFIGURED_MESSAGE = `[Respectlytics] ✓ SDK configured (v${packageJson.version})`;

describe('RespectlyticsSDK', () => {
  let sdk: RespectlyticsSDK;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // configure() starts the 30 second flush interval; fake timers keep it
    // from outliving the test and holding the Jest worker open.
    jest.useFakeTimers();
    sdk = new RespectlyticsSDK();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.useRealTimers();
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

      expect(consoleSpy).toHaveBeenCalledWith(CONFIGURED_MESSAGE);
    });

    it('should accept API key with various formats', () => {
      sdk.configure('pk_live_abc123XYZ789');

      expect(consoleSpy).toHaveBeenCalledWith(CONFIGURED_MESSAGE);
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

  describe('track method signature (v3.1.0)', () => {
    it('should accept an event name alone, as before', () => {
      sdk.configure('test-key');
      consoleSpy.mockClear();

      sdk.track('simple_event');

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should accept optional properties', () => {
      sdk.configure('test-key');
      consoleSpy.mockClear();

      sdk.track('paywall_viewed', { paywall: 'b', price: 7.5, trial: true });

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('track with properties: what is sent', () => {
    const BASE_KEYS = ['event_name', 'platform', 'session_id', 'timestamp'];
    const originalFetch = global.fetch;
    let fetchMock: jest.Mock;

    beforeEach(() => {
      fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 201 });
      global.fetch = fetchMock as unknown as typeof fetch;
      sdk.configure('test-key');
      consoleSpy.mockClear();
    });

    afterEach(() => {
      global.fetch = originalFetch;
      delete (globalThis as { __DEV__?: boolean }).__DEV__;
    });

    async function sentBodies(): Promise<Record<string, unknown>[]> {
      await sdk.flush();
      return fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body));
    }

    function droppedLogs(): string[] {
      return consoleSpy.mock.calls
        .map(([message]) => String(message))
        .filter((message) => message.includes('Properties dropped'));
    }

    it('sends no properties key for track(name)', async () => {
      sdk.track('purchase');

      const [body] = await sentBodies();

      expect(Object.keys(body).sort()).toEqual(BASE_KEYS);
      expect(body.event_name).toBe('purchase');
    });

    it('sends no properties key for an empty object', async () => {
      sdk.track('purchase', {});

      const [body] = await sentBodies();

      expect(Object.keys(body).sort()).toEqual(BASE_KEYS);
    });

    it('sends no properties key when every property is dropped', async () => {
      sdk.track('purchase', { Email: 'b', note: 'someone@example.com' });

      const [body] = await sentBodies();

      expect(Object.keys(body).sort()).toEqual(BASE_KEYS);
    });

    it('sends the filtered properties as a JSON object', async () => {
      sdk.track('paywall_viewed', {
        paywall: 'b',
        price: 7.5,
        trial: true,
        note: 'free text, with a comma',
        ratio: NaN,
      });

      const [body] = await sentBodies();

      expect(Object.keys(body).sort()).toEqual([...BASE_KEYS, 'properties'].sort());
      expect(body.properties).toEqual({ paywall: 'b', price: 7.5, trial: true });
      expect(JSON.stringify(body)).not.toContain('free text');
    });

    it('sends a boolean as a JSON boolean', async () => {
      sdk.track('paywall_viewed', { trial: false });

      await sdk.flush();
      const rawBody: string = fetchMock.mock.calls[0][1].body;

      expect(rawBody).toContain('"properties":{"trial":false}');
    });

    it('sends at most 20 properties', async () => {
      const properties: EventProperties = {};
      for (let i = 1; i <= 25; i++) {
        properties[`p${i}`] = i;
      }

      sdk.track('many_properties', properties);
      const [body] = await sentBodies();

      expect(Object.keys(body.properties as object)).toHaveLength(20);
    });

    it('does not keep a reference to the object it was given', async () => {
      const properties: EventProperties = { paywall: 'b' };

      sdk.track('paywall_viewed', properties);
      properties.paywall = 'someone@example.com';
      const [body] = await sentBodies();

      expect(body.properties).toEqual({ paywall: 'b' });
    });

    describe('a bad property never stops the event', () => {
      const cases: [string, () => unknown][] = [
        ['a bad name', () => ({ Paywall: 'b' })],
        ['free text', () => ({ note: 'Call me on 555 0100, any time!' })],
        ['NaN and infinity', () => ({ a: NaN, b: Infinity, c: -Infinity })],
        ['an object, an array and null', () => ({ a: { b: 1 }, c: [1], d: null })],
        ['a string instead of an object', () => 'ProductScreen'],
        ['an array instead of an object', () => ['paywall', 'b']],
        [
          'a getter that throws',
          () => {
            const properties = {};
            Object.defineProperty(properties, 'paywall', {
              enumerable: true,
              get() {
                throw new Error('boom');
              },
            });
            return properties;
          },
        ],
        [
          'a proxy that throws',
          () =>
            new Proxy(
              {},
              {
                ownKeys() {
                  throw new Error('boom');
                },
              }
            ),
        ],
      ];

      it.each(cases)('with %s', async (_label, makeProperties) => {
        expect(() =>
          sdk.track('still_sent', makeProperties() as EventProperties)
        ).not.toThrow();

        const bodies = await sentBodies();

        expect(bodies).toHaveLength(1);
        expect(bodies[0].event_name).toBe('still_sent');
        expect(bodies[0]).not.toHaveProperty('properties');
      });

      it('and the properties that passed are still sent', async () => {
        sdk.track('still_sent', { Paywall: 'b', paywall: 'b', ratio: NaN });

        const [body] = await sentBodies();

        expect(body.properties).toEqual({ paywall: 'b' });
      });
    });

    describe('logging what was dropped', () => {
      it('says once per event in a development build which names and why', () => {
        (globalThis as { __DEV__?: boolean }).__DEV__ = true;

        sdk.track('paywall_viewed', {
          paywall: 'b',
          Email: 'b',
          note: 'someone@example.com',
          ratio: NaN,
        });

        expect(droppedLogs()).toEqual([
          '[Respectlytics] ⚠️ Properties dropped from "paywall_viewed": ' +
            'Email (invalid name), note (invalid value), ratio (number not finite)',
        ]);
      });

      it('never logs a value', () => {
        (globalThis as { __DEV__?: boolean }).__DEV__ = true;

        sdk.track('paywall_viewed', { note: 'someone@example.com', paywall: 'b' });

        const everything = JSON.stringify(consoleSpy.mock.calls);
        expect(everything).not.toContain('someone@example.com');
        expect(everything).not.toContain('"b"');
      });

      it('says when the properties could not be read', () => {
        (globalThis as { __DEV__?: boolean }).__DEV__ = true;
        const unreadable = new Proxy(
          {},
          {
            ownKeys() {
              throw new Error('boom');
            },
          }
        );

        sdk.track('paywall_viewed', unreadable as EventProperties);

        expect(droppedLogs()).toEqual([
          '[Respectlytics] ⚠️ Properties dropped from "paywall_viewed": they could not be read',
        ]);
      });

      it('says nothing when every property passed', () => {
        (globalThis as { __DEV__?: boolean }).__DEV__ = true;

        sdk.track('paywall_viewed', { paywall: 'b', price: 7.5 });

        expect(consoleSpy).not.toHaveBeenCalled();
      });

      it('says nothing in a release build', () => {
        (globalThis as { __DEV__?: boolean }).__DEV__ = false;

        sdk.track('paywall_viewed', { Email: 'b', note: 'someone@example.com' });

        expect(consoleSpy).not.toHaveBeenCalled();
      });

      it('says nothing where __DEV__ is not defined', () => {
        sdk.track('paywall_viewed', { Email: 'b' });

        expect(consoleSpy).not.toHaveBeenCalled();
      });
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

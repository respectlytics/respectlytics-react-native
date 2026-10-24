/**
 * NetworkClient payload tests
 * Respectlytics React Native SDK
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { NetworkClient } from '../src/NetworkClient';
import { Event } from '../src/types';

describe('NetworkClient JSON body', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;
  let client: NetworkClient;

  const baseEvent: Event = {
    eventName: 'paywall_viewed',
    timestamp: '2026-10-24T12:00:00.000Z',
    sessionId: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    platform: 'iOS',
  };

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 201 });
    global.fetch = fetchMock as unknown as typeof fetch;
    client = new NetworkClient();
    client.configure('test-key');
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  async function sentBody(event: Event): Promise<string> {
    await client.sendEvent(event);
    return fetchMock.mock.calls[0][1].body;
  }

  it('is unchanged for an event without properties', async () => {
    expect(await sentBody(baseEvent)).toBe(
      '{"event_name":"paywall_viewed","timestamp":"2026-10-24T12:00:00.000Z",' +
        '"session_id":"a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4","platform":"iOS"}'
    );
  });

  it('has no properties key for an empty properties object', async () => {
    const body = JSON.parse(await sentBody({ ...baseEvent, properties: {} }));

    expect(body).not.toHaveProperty('properties');
  });

  it('carries the properties as a JSON object', async () => {
    const body = JSON.parse(
      await sentBody({ ...baseEvent, properties: { paywall: 'b', price: 7.5, trial: true } })
    );

    expect(body).toEqual({
      event_name: 'paywall_viewed',
      timestamp: '2026-10-24T12:00:00.000Z',
      session_id: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
      platform: 'iOS',
      properties: { paywall: 'b', price: 7.5, trial: true },
    });
  });

  it('still sends the app key header', async () => {
    await client.sendEvent(baseEvent);

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      'X-App-Key': 'test-key',
    });
  });
});

describe('NetworkClient.sendEvent: what each answer does', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;
  let client: NetworkClient;
  let consoleSpy: jest.SpyInstance;

  const plain: Event = {
    eventName: 'purchase',
    timestamp: '2026-10-24T12:00:00.000Z',
    sessionId: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    platform: 'iOS',
  };
  const withProperties: Event = { ...plain, eventName: 'paywall_viewed', properties: { paywall: 'b' } };

  const status = (code: number) => ({ ok: code >= 200 && code < 300, status: code });
  const offline = () => Promise.reject(new TypeError('Network request failed'));
  const timedOut = () => {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    return Promise.reject(error);
  };

  /** Answer each request in turn; the last answer repeats. */
  function answer(...answers: (number | (() => Promise<never>))[]): void {
    let call = 0;
    fetchMock.mockImplementation(() => {
      const next = answers[Math.min(call++, answers.length - 1)];
      return typeof next === 'number' ? Promise.resolve(status(next)) : next();
    });
  }

  /** Run a send to the end, through the backoff delays. */
  async function send(event: Event): Promise<boolean> {
    const settled = client.sendEvent(event).then(
      (value) => ({ value }),
      (error: Error) => ({ error })
    );
    await jest.advanceTimersByTimeAsync(60_000);
    const result = await settled;
    if ('error' in result) {
      throw result.error;
    }
    return result.value;
  }

  const bodies = (): Record<string, unknown>[] =>
    fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body));

  const logs = (): string[] => consoleSpy.mock.calls.map(([message]) => String(message));

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    client = new NetworkClient();
    client.configure('test-key');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleSpy.mockRestore();
    jest.useRealTimers();
    delete (globalThis as { __DEV__?: boolean }).__DEV__;
  });

  it('accepts a 201 with one request', async () => {
    answer(201);

    await expect(send(plain)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logs()).toEqual([]);
  });

  describe('400 is final', () => {
    it('drops an event without properties after one request, with one log line', async () => {
      answer(400);

      await expect(send(plain)).resolves.toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(logs()).toEqual(['[Respectlytics] ⚠️ Server refused the event "purchase" (400), dropped']);
    });

    it('sends an event with properties once more without them', async () => {
      answer(400, 201);

      await expect(send(withProperties)).resolves.toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(bodies()[0].properties).toEqual({ paywall: 'b' });
      expect(bodies()[1]).not.toHaveProperty('properties');
      expect(bodies()[1]).toEqual({ ...bodies()[0], properties: undefined });
    });

    it('says so in one line in a development build', async () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = true;
      answer(400, 201);

      await send(withProperties);

      expect(logs()).toEqual([
        '[Respectlytics] ⚠️ Server refused the properties of "paywall_viewed", event sent without them',
      ]);
    });

    it('says nothing about it in a release build', async () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = false;
      answer(400, 201);

      await send(withProperties);

      expect(logs()).toEqual([]);
    });

    it('drops the event when it is refused without properties too', async () => {
      answer(400, 400);

      await expect(send(withProperties)).resolves.toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(logs()).toEqual([
        '[Respectlytics] ⚠️ Server refused the event "paywall_viewed" (400), dropped',
      ]);
    });

    it('keeps the event for later when the resend without properties cannot get through', async () => {
      answer(400, 503);

      await expect(send(withProperties)).rejects.toThrow('SERVER_ERROR');
      expect(fetchMock).toHaveBeenCalledTimes(1 + 3);
    });
  });

  describe('retried as before, at most 3 attempts in all', () => {
    it.each([
      ['429', 429, 'RATE_LIMITED'],
      ['500', 500, 'SERVER_ERROR'],
      ['503', 503, 'SERVER_ERROR'],
      ['a network error', offline, 'NETWORK_ERROR'],
      ['a timeout', timedOut, 'TIMEOUT'],
      ['an unexpected status (404)', 404, 'INVALID_RESPONSE'],
    ])('%s is tried 3 times, then kept for later', async (_label, failure, error) => {
      answer(failure);

      await expect(send(withProperties)).rejects.toThrow(error);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      // Never resent without its properties: only a 400 does that
      expect(bodies().every((body) => 'properties' in body)).toBe(true);
    });

    it.each([
      ['429', 429],
      ['500', 500],
      ['a network error', offline],
    ])('%s then a 201 is accepted', async (_label, failure) => {
      answer(failure, failure, 201);

      await expect(send(plain)).resolves.toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('waits 2 and then 4 seconds between attempts', async () => {
      answer(500, 500, 201);
      const result = client.sendEvent(plain);

      await jest.advanceTimersByTimeAsync(1_999);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(3_999);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(1);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      await expect(result).resolves.toBe(true);
    });
  });

  it('leaves 401 as before: thrown at once, never resent without properties', async () => {
    answer(401);

    await expect(send(withProperties)).rejects.toThrow('UNAUTHORIZED');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

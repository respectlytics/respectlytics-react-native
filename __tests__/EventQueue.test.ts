/**
 * EventQueue tests
 * Respectlytics React Native SDK
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { EventQueue } from '../src/EventQueue';
import { NetworkClient } from '../src/NetworkClient';
import { RespectlyticsSDK } from '../src/Respectlytics';
import { Event } from '../src/types';

function event(eventName: string, properties?: Event['properties']): Event {
  return {
    eventName,
    timestamp: '2026-10-24T12:00:00.000Z',
    sessionId: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    platform: 'iOS',
    ...(properties ? { properties } : {}),
  };
}

describe('EventQueue.flush', () => {
  let consoleSpy: jest.SpyInstance;
  let sendEvent: jest.Mock<Promise<boolean>, [Event]>;
  let queue: EventQueue;

  const sentNames = () => sendEvent.mock.calls.map(([sent]) => sent.eventName);

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    sendEvent = jest.fn();
    const client = { isConfigured: () => true, sendEvent } as unknown as NetworkClient;
    queue = new EventQueue(client);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('sends each event on its own, in order', async () => {
    sendEvent.mockResolvedValue(true);
    ['a', 'b', 'c'].forEach((name) => queue.add(event(name)));

    await queue.flush();

    expect(sentNames()).toEqual(['a', 'b', 'c']);
    expect(queue.getQueueSize()).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith('[Respectlytics] ✓ Sent 3 event(s)');
  });

  it('keeps only the events not yet sent when one fails', async () => {
    sendEvent
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('SERVER_ERROR'))
      .mockResolvedValue(true);
    ['a', 'b', 'c'].forEach((name) => queue.add(event(name)));

    await queue.flush();
    expect(queue.getQueueSize()).toBe(2);

    await queue.flush();

    // a was accepted the first time and is never sent again
    expect(sentNames()).toEqual(['a', 'b', 'b', 'c']);
    expect(queue.getQueueSize()).toBe(0);
  });

  it('does not let a dropped (400) event hold up the ones behind it', async () => {
    sendEvent.mockImplementation(async (sent) => sent.eventName !== 'refused');
    ['a', 'refused', 'c'].forEach((name) => queue.add(event(name)));

    await queue.flush();
    await queue.flush();

    expect(sentNames()).toEqual(['a', 'refused', 'c']);
    expect(queue.getQueueSize()).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith('[Respectlytics] ✓ Sent 2 event(s)');
  });

  it('puts the unsent events back ahead of those added during the flush', async () => {
    let failSecond: (error: Error) => void = () => undefined;
    sendEvent
      .mockResolvedValueOnce(true)
      .mockImplementationOnce(() => new Promise((_resolve, reject) => (failSecond = reject)))
      .mockResolvedValue(true);
    ['a', 'b', 'c'].forEach((name) => queue.add(event(name)));

    const flushing = queue.flush();
    await Promise.resolve();
    await Promise.resolve();
    queue.add(event('d'));
    failSecond(new Error('NETWORK_ERROR'));
    await flushing;

    await queue.flush();

    expect(sentNames()).toEqual(['a', 'b', 'b', 'c', 'd']);
  });
});

describe('Queue against the server, through track and flush', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;
  let consoleSpy: jest.SpyInstance;
  let sdk: RespectlyticsSDK;

  type Request = { event_name: string; properties?: Record<string, unknown> };
  const requests = (): Request[] => fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body));
  const named = (name: string) => requests().filter((request) => request.event_name === name);
  const status = (code: number) => Promise.resolve({ ok: code >= 200 && code < 300, status: code });

  /**
   * Flush and run through the backoff delays (2 s, then 4 s), staying under
   * the queue's own 30 second flush timer so only this flush runs.
   */
  async function flush(): Promise<void> {
    const flushing = sdk.flush();
    await jest.advanceTimersByTimeAsync(10_000);
    await flushing;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    sdk = new RespectlyticsSDK();
    sdk.configure('test-key');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleSpy.mockRestore();
    jest.useRealTimers();
  });

  it('a server that refuses properties (older Community Edition) still gets every event, once', async () => {
    // Answers 400 to any body with properties, like a server older than 3.1.0
    fetchMock.mockImplementation((_url, init) =>
      status('properties' in JSON.parse(init.body) ? 400 : 201)
    );

    sdk.track('paywall_viewed', { paywall: 'b' });
    sdk.track('purchase');
    sdk.track('checkout_started', { price: 7.5 });
    await flush();

    expect(named('paywall_viewed').map((r) => 'properties' in r)).toEqual([true, false]);
    expect(named('purchase')).toHaveLength(1);
    expect(named('checkout_started').map((r) => 'properties' in r)).toEqual([true, false]);

    fetchMock.mockClear();
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('an event refused outright is dropped and the next one is still sent', async () => {
    fetchMock.mockImplementation((_url, init) =>
      status(JSON.parse(init.body).event_name === 'refused' ? 400 : 201)
    );

    sdk.track('refused', { paywall: 'b' });
    sdk.track('after');
    await flush();
    await flush();

    expect(named('refused')).toHaveLength(2); // with properties, then without
    expect(named('after')).toHaveLength(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Respectlytics] ⚠️ Server refused the event "refused" (400), dropped'
    );
  });

  it('a server error keeps the unsent events, and the accepted ones are not sent again', async () => {
    let down = true;
    fetchMock.mockImplementation((_url, init) =>
      status(down && JSON.parse(init.body).event_name === 'second' ? 500 : 201)
    );

    sdk.track('first');
    sdk.track('second', { paywall: 'b' });
    sdk.track('third');
    await flush();

    expect(named('first')).toHaveLength(1);
    expect(named('second')).toHaveLength(3);
    expect(named('third')).toHaveLength(0);

    down = false;
    await flush();

    expect(named('first')).toHaveLength(1);
    expect(named('second')).toHaveLength(4);
    expect(named('second')[3].properties).toEqual({ paywall: 'b' });
    expect(named('third')).toHaveLength(1);
  });

  it('a 401 keeps the event and the ones behind it for later, as before', async () => {
    fetchMock.mockImplementation(() => status(401));

    sdk.track('first');
    sdk.track('second');
    await flush();

    expect(requests().map((r) => r.event_name)).toEqual(['first']);

    fetchMock.mockImplementation(() => status(201));
    await flush();

    expect(requests().map((r) => r.event_name)).toEqual(['first', 'first', 'second']);
  });
});

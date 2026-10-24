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
    await client.send([event]);
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
    await client.send([baseEvent]);

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      'X-App-Key': 'test-key',
    });
  });
});

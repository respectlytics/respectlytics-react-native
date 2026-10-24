/**
 * NetworkClient.ts
 * Respectlytics React Native SDK
 *
 * Handles HTTP communication with the Respectlytics API.
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { Event } from './types';
import { isDevelopmentBuild } from './environment';

const DEFAULT_API_ENDPOINT = 'https://respectlytics.com/api/v1/events/';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;

export enum NetworkError {
  NotConfigured = 'NOT_CONFIGURED',
  InvalidResponse = 'INVALID_RESPONSE',
  Unauthorized = 'UNAUTHORIZED',
  BadRequest = 'BAD_REQUEST',
  RateLimited = 'RATE_LIMITED',
  ServerError = 'SERVER_ERROR',
  NetworkError = 'NETWORK_ERROR',
  Timeout = 'TIMEOUT',
}

export class NetworkClient {
  private apiKey: string | null = null;
  private apiEndpoint: string = DEFAULT_API_ENDPOINT;

  /**
   * Configure the network client with an API key and optional custom endpoint
   */
  configure(apiKey: string, apiEndpoint?: string): void {
    this.apiKey = apiKey;
    if (apiEndpoint) {
      this.apiEndpoint = apiEndpoint;
    }
  }

  /**
   * Check if the client is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  /**
   * Send one event to the API.
   *
   * Retries network errors, timeouts, 429 and 5xx with exponential backoff,
   * and throws when sending is worth trying again later (401 included), so
   * the queue keeps the event.
   *
   * A 400 is final, since no retry can change it. An event with properties is
   * then sent once more without them, for a server older than v3.1.0 (a
   * self-hosted Community Edition not yet updated) that refuses the properties
   * field. If the server refuses the event itself, it is dropped, so it never
   * holds up the events queued after it.
   *
   * @returns true when the server accepted the event, false when it was dropped
   */
  async sendEvent(event: Event): Promise<boolean> {
    if (!this.apiKey) {
      throw new Error(NetworkError.NotConfigured);
    }

    try {
      await this.sendWithRetry(event);
      return true;
    } catch (error) {
      if (!isBadRequest(error)) {
        throw error;
      }
    }

    if (event.properties && Object.keys(event.properties).length > 0) {
      try {
        await this.sendWithRetry(
          {
            eventName: event.eventName,
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            platform: event.platform,
          }
        );
        if (isDevelopmentBuild()) {
          console.log(
            `[Respectlytics] ⚠️ Server refused the properties of "${event.eventName}", event sent without them`
          );
        }
        return true;
      } catch (error) {
        if (!isBadRequest(error)) {
          throw error;
        }
      }
    }

    console.log(`[Respectlytics] ⚠️ Server refused the event "${event.eventName}" (400), dropped`);
    return false;
  }

  /**
   * Send a single event, at most MAX_RETRIES attempts in all.
   *
   * Network errors, timeouts, 429, 5xx and any other unexpected status are
   * tried again with exponential backoff; 401 and 400 are thrown at once.
   * The last failure is thrown, so the caller can tell them apart.
   */
  private async sendWithRetry(event: Event): Promise<void> {
    for (let attempt = 1; ; attempt++) {
      const failure = await this.attemptSend(event);
      if (!failure) {
        return; // Success
      }
      if (!failure.retry || attempt >= MAX_RETRIES) {
        throw failure.error;
      }
      await this.delay(Math.pow(2, attempt) * 1000);
    }
  }

  /**
   * One POST of the event: null on success, otherwise what failed and
   * whether another attempt could succeed.
   */
  private async attemptSend(event: Event): Promise<{ error: Error; retry: boolean } | null> {
    if (!this.apiKey) {
      throw new Error(NetworkError.NotConfigured);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Key': this.apiKey,
        },
        body: JSON.stringify(this.eventToPayload(event)),
        signal: controller.signal,
      });
    } catch (error) {
      // Aborted by the timeout, or no connection at all
      const timedOut = error instanceof Error && error.name === 'AbortError';
      return {
        error: new Error(timedOut ? NetworkError.Timeout : NetworkError.NetworkError),
        retry: true,
      };
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.ok) {
      return null;
    }

    switch (response.status) {
      case 401:
        return { error: new Error(NetworkError.Unauthorized), retry: false };
      case 400:
        return { error: new Error(NetworkError.BadRequest), retry: false };
      case 429:
        return { error: new Error(NetworkError.RateLimited), retry: true };
      default:
        if (response.status >= 500) {
          return { error: new Error(NetworkError.ServerError), retry: true };
        }
        return { error: new Error(NetworkError.InvalidResponse), retry: true };
    }
  }

  /**
   * Convert Event object to API payload format.
   * The SDK sends 4 fields; the API stores 5 (adding country derived from IP).
   * `properties` is added only when the event has any (already filtered by
   * `track`), so an event without them is sent exactly as before.
   */
  private eventToPayload(event: Event): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      event_name: event.eventName,
      timestamp: event.timestamp,
      session_id: event.sessionId,
      platform: event.platform,
    };

    if (event.properties && Object.keys(event.properties).length > 0) {
      payload.properties = event.properties;
    }

    return payload;
  }

  /**
   * Helper to delay for exponential backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

function isBadRequest(error: unknown): boolean {
  return error instanceof Error && error.message === NetworkError.BadRequest;
}

export const networkClient = new NetworkClient();

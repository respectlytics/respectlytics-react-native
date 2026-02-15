/**
 * NetworkClient.ts
 * Respectlytics React Native SDK
 *
 * Handles HTTP communication with the Respectlytics API.
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { Event } from './types';

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
   * Send events to the API
   */
  async send(events: Event[]): Promise<void> {
    if (!this.apiKey) {
      throw new Error(NetworkError.NotConfigured);
    }

    for (const event of events) {
      await this.sendEvent(event, 1);
    }
  }

  /**
   * Send a single event with retry logic
   */
  private async sendEvent(event: Event, attempt: number): Promise<void> {
    if (!this.apiKey) {
      throw new Error(NetworkError.NotConfigured);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Key': this.apiKey,
        },
        body: JSON.stringify(this.eventToPayload(event)),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return; // Success
      }

      switch (response.status) {
        case 401:
          throw new Error(NetworkError.Unauthorized);
        case 400:
          throw new Error(NetworkError.BadRequest);
        case 429:
          // Rate limited - retry with backoff
          if (attempt < MAX_RETRIES) {
            await this.delay(Math.pow(2, attempt) * 1000);
            return this.sendEvent(event, attempt + 1);
          }
          throw new Error(NetworkError.RateLimited);
        default:
          if (response.status >= 500) {
            // Server error - retry with backoff
            if (attempt < MAX_RETRIES) {
              await this.delay(Math.pow(2, attempt) * 1000);
              return this.sendEvent(event, attempt + 1);
            }
            throw new Error(NetworkError.ServerError);
          }
          throw new Error(NetworkError.InvalidResponse);
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        // Don't retry auth or bad request errors
        if (
          error.message === NetworkError.Unauthorized ||
          error.message === NetworkError.BadRequest
        ) {
          throw error;
        }

        // Check for abort (timeout)
        if (error.name === 'AbortError') {
          if (attempt < MAX_RETRIES) {
            await this.delay(Math.pow(2, attempt) * 1000);
            return this.sendEvent(event, attempt + 1);
          }
          throw new Error(NetworkError.Timeout);
        }
      }

      // Network error - retry with backoff
      if (attempt < MAX_RETRIES) {
        await this.delay(Math.pow(2, attempt) * 1000);
        return this.sendEvent(event, attempt + 1);
      }

      throw new Error(NetworkError.NetworkError);
    }
  }

  /**
   * Convert Event object to API payload format.
   * The SDK sends 4 fields; the API stores 5 (adding country derived from IP).
   */
  private eventToPayload(event: Event): Record<string, unknown> {
    return {
      event_name: event.eventName,
      timestamp: event.timestamp,
      session_id: event.sessionId,
      platform: event.platform,
    };
  }

  /**
   * Helper to delay for exponential backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const networkClient = new NetworkClient();

# Respectlytics React Native SDK

[![npm version](https://img.shields.io/npm/v/respectlytics-react-native.svg)](https://www.npmjs.com/package/respectlytics-react-native)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)](https://github.com/respectlytics/respectlytics-react-native)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Official Respectlytics SDK for React Native. Privacy-first, session-based analytics with automatic session management, zero device storage, and no device identifier collection.

## Philosophy: Return of Avoidance (ROA)

Respectlytics helps developers avoid collecting personal data in the first place. We believe the best way to handle sensitive data is to never collect it.

Our SDK sends 4 fields with every event, and the API stores 5 total:
- `event_name` - What happened
- `timestamp` - When it happened
- `session_id` - Groups events in a session (RAM-only, auto-rotates)
- `platform` - iOS or Android
- `country` - Derived server-side from IP (IP immediately discarded, never stored)

No device identifiers, no fingerprinting, no persistent tracking.
An event can also carry properties you declare, such as an A/B test variant.
See [Properties and A/B tests](#properties-and-ab-tests).

## Features

- 🔒 **Privacy-First**: No device identifiers (IDFA, GAID, Android ID)
- ⚡ **Simple Integration**: 2 lines of code to get started
- 🧠 **RAM-Only**: Event queue and sessions held entirely in memory — zero device storage
- 🔄 **Automatic Sessions**: RAM-only, 2-hour rotation, new session on app restart
- 📱 **Cross-Platform**: iOS and Android support

## Requirements

- React Native 0.70+
- iOS 15.0+ / Android API 21+
- Node.js 16+

## Installation

```bash
npm install respectlytics-react-native @react-native-community/netinfo
```

or with Yarn:

```bash
yarn add respectlytics-react-native @react-native-community/netinfo
```

### iOS Setup

```bash
cd ios && pod install
```

### Android Setup

No additional setup required - autolinking handles everything.

## Quick Start

```typescript
import Respectlytics from 'respectlytics-react-native';

// 1. Configure at app startup
Respectlytics.configure('your-api-key');

// 2. Track events
Respectlytics.track('purchase');
Respectlytics.track('view_product');

// For self-hosted instances:
Respectlytics.configure('your-api-key', {
  apiEndpoint: 'https://your-server.com/api/v1/events/',
});
```

That's it! Session management is fully automatic.

## API Reference

### `configure(apiKey: string, options?: { apiEndpoint?: string })`

Initialize the SDK with your API key. Call once at app startup.

```typescript
// Respectlytics Cloud (default)
Respectlytics.configure('your-api-key');

// Self-hosted instance
Respectlytics.configure('your-api-key', {
  apiEndpoint: 'https://your-server.com/api/v1/events/',
});
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your Respectlytics API key |
| `options.apiEndpoint` | `string` | No | Custom endpoint for self-hosted instances |

### `track(eventName: string, properties?: EventProperties)`

Track an event, with optional properties.

```typescript
Respectlytics.track('button_clicked');
Respectlytics.track('checkout_started');
Respectlytics.track('paywall_viewed', { paywall: 'b' });
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventName` | `string` | Yes | Name of the event, at most 100 characters |
| `properties` | `EventProperties` | No | Names to a string, a number or `true`/`false`. See [Properties and A/B tests](#properties-and-ab-tests). |

### `flush()`

Force send all queued events immediately. Rarely needed - the SDK auto-flushes.

```typescript
await Respectlytics.flush();
```

## Properties and A/B tests

An event can carry properties, such as the paywall variant a person saw.
The server keeps a property on paid plans, once you declare it in the app's Settings on respectlytics.com.
On the free plan the server drops every property.
You declare a property as a list of values, or as a number, which is kept as a band such as "5 to 10".

```typescript
// An A/B test: which paywall variant was shown
Respectlytics.track('paywall_viewed', { paywall: 'b' });

// A number, kept as a band
Respectlytics.track('checkout_started', { price: 7.5 });
```

What is dropped:

- A property you have not declared, and a value that is not on its list. The server drops these.
- Free text. A value starts with a letter or digit and holds at most 40 letters, digits, spaces, dots, underscores or hyphens. Anything else, such as an email address, a URL or a longer text, is dropped on the device and never sent.
- A name that is not lowercase letters, digits and underscores, starting with a letter, at most 40 characters.
- A number that is not finite, and any value that is not a string, a number or `true`/`false`. Use `true` and `false` for a property declared with those two values.
- Every property after the first 20.

The event itself is always sent, with the properties that passed.
In a development build the SDK logs which names it dropped and why, never the values.
The SDK does not know what you declared, and it makes no extra network call to find out.

## 🔄 Automatic Session Management

Session IDs are managed entirely by the SDK - no configuration needed.

| Behavior | Description |
|----------|-------------|
| **New session on app launch** | Every time your app starts, a fresh session begins |
| **2-hour rotation** | Sessions automatically rotate after 2 hours of use |
| **RAM-only storage** | Session IDs are never written to disk |
| **No cross-session tracking** | Each session is independent and anonymized |

## Privacy Architecture

Respectlytics uses anonymized identifiers stored only in device memory (RAM) that rotate automatically every two hours or upon app restart. IP addresses are processed transiently for approximate country lookup and immediately discarded—no personal data is ever persisted.

Our system is:
- **Transparent** - Clear about what data is collected
- **Defensible** - Minimal data surface by design
- **Clear** - Explicit reasoning for each field

| What we DON'T collect | Why |
|----------------------|-----|
| IDFA / GAID | Device advertising IDs can track users across apps |
| Device fingerprints | Can be used to identify users without consent |
| IP addresses | Processed transiently for geolocation, then discarded |
| Undeclared properties and free text | Dropped on the device or by the server; only declared values, and numbers as bands, are stored |
| Persistent user IDs | Cross-session tracking is unnecessary |

| What we DO collect | Purpose |
|-------------------|---------|
| Event name | Analytics |
| Timestamp | When the event occurred |
| Random session ID (RAM-only) | Group events in a session |
| Platform | iOS or Android |
| Properties you declare (optional) | A value from your list, or a number as a band |

### Server-Side Only

Country is derived server-side from IP addresses, then IP is immediately discarded.

## Automatic Behaviors

The SDK handles these automatically - no developer action needed:

| Feature | Behavior |
|---------|----------|
| **Session Management** | New session ID on app launch, rotates after 2 hours |
| **Event Batching** | Events queued in memory and sent in batches (max 10 events or 30 seconds) |
| **Offline Handling** | Events held in RAM when offline, sent when connectivity returns |
| **Retry Logic** | Failed requests retry with exponential backoff (max 3 attempts) |
| **Background Sync** | Events flushed when app enters background |

## Event Queue (RAM-Only)

Events are held in memory and sent automatically:

1. Events are added to an in-memory array — nothing is written to device storage
2. Network status is monitored via NetInfo
3. Queue is flushed when connectivity is restored
4. Failed sends are retried with exponential backoff

**Unsent events are lost on force-quit** — this is a deliberate privacy trade-off. The SDK writes zero bytes to the device for analytics purposes. The ~1-3% event loss from force-quits has no meaningful impact on session-based aggregate analytics.

## Migration from v3.0.x

### Changes in v3.1.0

- `track()` takes optional properties as a second argument. See [Properties and A/B tests](#properties-and-ab-tests).
- An event without properties is sent exactly as before.

### What to do

No breaking changes. Existing code works as-is.

## Migration from v2.x

### Changes in v3.0.0

- **BREAKING**: Event queue no longer persists to AsyncStorage
- **REMOVED**: `@react-native-async-storage/async-storage` peer dependency
- Events are now held in RAM only — zero device storage
- Unsent events are lost on force-quit (deliberate privacy trade-off)

### What to do

1. Update your install command (AsyncStorage is no longer needed):
   ```bash
   # Before
   npm install respectlytics-react-native @react-native-async-storage/async-storage @react-native-community/netinfo

   # After
   npm install respectlytics-react-native @react-native-community/netinfo
   ```
2. Optionally remove `@react-native-async-storage/async-storage` if nothing else uses it
3. **No code changes required** — the public API (`configure`, `track`, `flush`) is unchanged

## Migration from v2.1.x

### Changes in v2.2.0

- `configure()` now accepts an optional second argument `{ apiEndpoint }` for self-hosted instances
- License changed from proprietary to MIT
- The API stores 5 fields total (the 4 sent by the SDK plus `country` derived server-side)

### What to do

No breaking changes. Existing code works as-is.

## Migration from v2.0.x

### Changes in v2.1.0

- The `screen` parameter of `track()` has been removed
- Deprecated fields (`screen`, `os_version`, `app_version`, `locale`, `device_type`, `region`) are no longer collected

### What to do

1. Update any `track()` calls that pass a screen name as the second parameter:
   ```typescript
   // Before
   Respectlytics.track('view_product', 'ProductScreen');

   // After
   Respectlytics.track('view_product');
   ```
2. That's it!

## Legal Note

Respectlytics provides a technical solution focused on privacy. Regulations vary by jurisdiction. Consult your legal team to determine your specific requirements.

## License

This SDK is licensed under the [MIT License](LICENSE).

## Support

- Documentation: [https://respectlytics.com/sdk/](https://respectlytics.com/sdk/)
- Issues: [https://github.com/respectlytics/respectlytics-react-native/issues](https://github.com/respectlytics/respectlytics-react-native/issues)
- Email: respectlytics@loheden.com

# Respectlytics React Native SDK

[![npm version](https://img.shields.io/npm/v/respectlytics-react-native.svg)](https://www.npmjs.com/package/respectlytics-react-native)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)](https://github.com/respectlytics/respectlytics-react-native)
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)

Official Respectlytics SDK for React Native. Privacy-first, session-based analytics with automatic session management, offline event queuing, and zero device identifier collection.

## Features

- 🔒 **Privacy-First**: No device identifiers (IDFA, GAID, Android ID)
- ⚡ **Simple Integration**: 2 lines of code to get started
- 📡 **Offline Support**: Events queue automatically and sync when online
- 🔄 **Automatic Sessions**: RAM-only, 2-hour rotation, new session on app restart
- ✅ **Designed for GDPR/ePrivacy compliance** - Potentially consent-free
- 📱 **Cross-Platform**: iOS and Android support

## Requirements

- React Native 0.70+
- iOS 15.0+ / Android API 21+
- Node.js 16+

## Installation

```bash
npm install respectlytics-react-native @react-native-async-storage/async-storage @react-native-community/netinfo
```

or with Yarn:

```bash
yarn add respectlytics-react-native @react-native-async-storage/async-storage @react-native-community/netinfo
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
Respectlytics.track('view_product', 'ProductScreen');
```

That's it! Session management is fully automatic.

## API Reference

### `configure(apiKey: string)`

Initialize the SDK with your API key. Call once at app startup.

```typescript
Respectlytics.configure('your-api-key');
```

### `track(eventName: string, screen?: string)`

Track an event with an optional screen name.

```typescript
Respectlytics.track('button_clicked');
Respectlytics.track('checkout_started', 'CartScreen');
```

### `flush()`

Force send all queued events immediately. Rarely needed - the SDK auto-flushes.

```typescript
await Respectlytics.flush();
```

## 🔄 Automatic Session Management

Session IDs are managed entirely by the SDK - no configuration needed.

| Behavior | Description |
|----------|-------------|
| **New session on app launch** | Every time your app starts, a fresh session begins |
| **2-hour rotation** | Sessions automatically rotate after 2 hours of use |
| **RAM-only storage** | Session IDs are never written to disk |
| **No cross-session tracking** | Each session is independent and anonymous |

This RAM-only approach ensures compliance with ePrivacy Directive Article 5(3) - no device storage means no consent requirement for the session identifier.

## Privacy by Design

Your privacy is our priority. Our mobile analytics solution is meticulously designed to provide valuable insights without compromising your data. We achieve this by collecting only session-based data, using anonymized identifiers that are stored only in your device's memory and renewed every two hours or upon app restart. IP addresses are processed transiently for approximate geolocation (country and region) only and are never stored. This privacy-by-design approach ensures that no personal data is retained, making our solution designed to comply with GDPR and the ePrivacy Directive, potentially enabling analytics without user consent in many jurisdictions.

| What we DON'T collect | Why |
|----------------------|-----|
| IDFA / GAID | Device advertising IDs can track users across apps |
| Device fingerprints | Can be used to identify users without consent |
| IP addresses | Processed transiently for geolocation, then discarded |
| Custom properties | Prevents accidental PII collection |
| Persistent user IDs | Cross-session tracking requires consent |

| What we DO collect | Purpose |
|-------------------|---------|
| Event name | Analytics |
| Screen name | Navigation analytics |
| Random session ID (RAM-only) | Group events in a session |
| Platform, OS version | Debugging |
| App version, locale | Debugging |
| Country, region | Approximate geolocation |

## Automatic Behaviors

The SDK handles these automatically - no developer action needed:

| Feature | Behavior |
|---------|----------|
| **Session Management** | New session ID on app launch, rotates after 2 hours |
| **Event Batching** | Events queued and sent in batches (max 10 events or 30 seconds) |
| **Offline Support** | Events queued when offline, sent when connectivity returns |
| **Retry Logic** | Failed requests retry with exponential backoff (max 3 attempts) |
| **Background Sync** | Events flushed when app enters background |

## Offline Support

Events are automatically queued when offline and sent when connectivity returns:

1. Events are immediately persisted to AsyncStorage
2. Network status is monitored via NetInfo
3. Queue is flushed when connectivity is restored
4. Failed sends are retried with exponential backoff

## Migration from v1.x

### Breaking Changes

- `identify()` method removed - no longer needed
- `reset()` method removed - no longer needed
- AsyncStorage no longer used for user IDs - sessions are RAM-only

### What to do

1. Remove any calls to `Respectlytics.identify()`
2. Remove any calls to `Respectlytics.reset()`
3. That's it! Session management is now automatic.

### Why This Change?

Storing identifiers on device (AsyncStorage) requires user consent under ePrivacy Directive Article 5(3). In-memory sessions require no consent, making Respectlytics truly consent-free analytics.

## License

This SDK is provided under a proprietary license. See [LICENSE](LICENSE) for details.

## Support

- Documentation: [https://respectlytics.com/sdk/](https://respectlytics.com/sdk/)
- Issues: [https://github.com/respectlytics/respectlytics-react-native/issues](https://github.com/respectlytics/respectlytics-react-native/issues)
- Email: respectlytics@loheden.com

# Respectlytics React Native SDK

[![npm version](https://img.shields.io/npm/v/respectlytics-react-native.svg)](https://www.npmjs.com/package/respectlytics-react-native)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)](https://github.com/respectlytics/respectlytics-react-native)
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)

Official Respectlytics SDK for React Native. Privacy-first analytics with automatic session management, offline event queuing, and zero device identifier collection.

## Features

- 🔒 **Privacy-First**: No device identifiers (IDFA, GAID, Android ID)
- ⚡ **Simple Integration**: 3 lines of code to get started
- 📡 **Offline Support**: Events queue automatically and sync when online
- 🔄 **Automatic Sessions**: 30-minute inactivity timeout, handled internally
- 🎯 **Cross-Session Tracking**: Optional persistent user IDs
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

// 2. Enable user tracking (optional)
Respectlytics.identify();

// 3. Track events
Respectlytics.track('purchase');
Respectlytics.track('view_product', 'ProductScreen');
```

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

### `identify()`

Enable cross-session user tracking. Generates and persists a random user ID.

```typescript
Respectlytics.identify();
```

### `reset()`

Clear the user ID. Call when user logs out.

```typescript
Respectlytics.reset();
```

### `flush()`

Force send all queued events immediately. Rarely needed - the SDK auto-flushes.

```typescript
await Respectlytics.flush();
```

## Privacy by Design

| What we DON'T collect | Why |
|----------------------|-----|
| IDFA / GAID | Device advertising IDs can track users across apps |
| Device fingerprints | Can be used to identify users without consent |
| IP addresses | Used only for geolocation lookup, then discarded |
| Custom properties | Prevents accidental PII collection |

| What we DO collect | Purpose |
|-------------------|---------|
| Event name | Analytics |
| Screen name | Navigation analytics |
| Random session ID | Group events in a session |
| Random user ID (opt-in) | Cross-session analytics |
| Platform, OS version | Debugging |
| App version | Debugging |

## Automatic Behaviors

The SDK handles these automatically - no developer action needed:

| Feature | Behavior |
|---------|----------|
| **Session Management** | New session ID generated on first event, rotates after 30 min inactivity |
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

## Session Management

Sessions are managed automatically:

- New session starts on first event
- Session rotates after 30 minutes of inactivity
- No developer action required

## License

This SDK is provided under a proprietary license. See [LICENSE](LICENSE) for details.

## Support

- Documentation: [https://respectlytics.com/docs/](https://respectlytics.com/docs/)
- Issues: [https://github.com/respectlytics/respectlytics-react-native/issues](https://github.com/respectlytics/respectlytics-react-native/issues)
- Email: respectlytics@loheden.com

# Respectlytics React Native SDK

[![npm version](https://img.shields.io/npm/v/respectlytics-react-native.svg)](https://www.npmjs.com/package/respectlytics-react-native)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)](https://github.com/respectlytics/respectlytics-react-native)
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)

Official Respectlytics SDK for React Native. Privacy-first, session-based analytics with automatic session management, offline event queuing, and zero device identifier collection.

## Philosophy: Return of Avoidance (ROA)

Respectlytics helps developers avoid collecting personal data in the first place. We believe the best way to handle sensitive data is to never collect it.

Our SDK collects only 4 fields:
- `event_name` - What happened
- `timestamp` - When it happened  
- `session_id` - Groups events in a session (RAM-only, auto-rotates)
- `platform` - iOS or Android

That's it. No device identifiers, no fingerprinting, no persistent tracking.

## Features

- 🔒 **Privacy-First**: No device identifiers (IDFA, GAID, Android ID)
- ⚡ **Simple Integration**: 2 lines of code to get started
- 📡 **Offline Support**: Events queue automatically and sync when online
- 🔄 **Automatic Sessions**: RAM-only, 2-hour rotation, new session on app restart
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
Respectlytics.track('view_product');
```

That's it! Session management is fully automatic.

## API Reference

### `configure(apiKey: string)`

Initialize the SDK with your API key. Call once at app startup.

```typescript
Respectlytics.configure('your-api-key');
```

### `track(eventName: string)`

Track an event.

```typescript
Respectlytics.track('button_clicked');
Respectlytics.track('checkout_started');
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
| Custom properties | Prevents accidental PII collection |
| Persistent user IDs | Cross-session tracking is unnecessary |

| What we DO collect | Purpose |
|-------------------|---------|
| Event name | Analytics |
| Timestamp | When the event occurred |
| Random session ID (RAM-only) | Group events in a session |
| Platform | iOS or Android |

### Server-Side Only

Country is derived server-side from IP addresses, then IP is immediately discarded.

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

## Migration from v2.0.x

### Changes in v2.1.0

- `track()` method now takes only `eventName` - the `screen` parameter has been removed
- The SDK now sends only 4 fields to the API (down from 10)
- Deprecated fields (`screen`, `os_version`, `app_version`, `locale`, `device_type`, `region`) are no longer collected

### What to do

1. Update any `track()` calls that pass a second parameter:
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

This SDK is provided under a proprietary license. See [LICENSE](LICENSE) for details.

## Support

- Documentation: [https://respectlytics.com/sdk/](https://respectlytics.com/sdk/)
- Issues: [https://github.com/respectlytics/respectlytics-react-native/issues](https://github.com/respectlytics/respectlytics-react-native/issues)
- Email: respectlytics@loheden.com

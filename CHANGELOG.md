# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-12-19

### ⚠️ Breaking Changes
- **REMOVED**: `screen` parameter from `track()` method
- **REMOVED**: Collection of deprecated fields (`os_version`, `app_version`, `locale`, `device_type`, `region`)

### Changed
- `track(eventName: string)` now takes only the event name
- SDK now sends only 4 fields: `event_name`, `timestamp`, `session_id`, `platform`
- Updated README with ROA (Return of Avoidance) philosophy
- Removed GDPR/ePrivacy compliance claims from documentation

### Why This Change?
The Respectlytics API enforces a strict allowlist of 4 stored fields to minimize data collection. Fields not on the allowlist were silently discarded, so removing them from the SDK reduces unnecessary data transmission and makes the SDK's behavior transparent.

### Migration
Update any `track()` calls that pass a second parameter:

```typescript
// Before
Respectlytics.track('view_product', 'ProductScreen');

// After
Respectlytics.track('view_product');
```

## [2.0.1] - 2025-12-12

### Changed
- Updated privacy compliance wording in documentation to clarify regulatory requirements and recommend legal consultation

## [2.0.0] - 2025-12-10

### ⚠️ Breaking Changes
- **REMOVED**: `identify()` method
- **REMOVED**: `reset()` method
- **REMOVED**: AsyncStorage for user IDs

### Changed
- Session IDs now generated in RAM only (never persisted to AsyncStorage)
- New session ID generated on every app launch
- Sessions rotate automatically every 2 hours (was 30 minutes inactivity)
- Updated documentation URL from /docs/ to /sdk/

### Migration
Remove any calls to `identify()` and `reset()`. Session management is now automatic.

## [1.0.1] - 2025-11-30

### Fixed
- Minor bug fixes and stability improvements

## [1.0.0] - 2025-11-15

### Added
- Initial release
- Privacy-first analytics with session-based tracking
- Automatic session management
- Event batching and offline support

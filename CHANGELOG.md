# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2025-12-12

### Changed
- Updated privacy compliance wording in documentation to clarify regulatory requirements and recommend legal consultation

## [2.0.0] - 2025-12-10

### ⚠️ Breaking Changes
- **REMOVED**: `identify()` method (GDPR/ePrivacy compliance)
- **REMOVED**: `reset()` method (no longer needed)
- **REMOVED**: AsyncStorage for user IDs

### Changed
- Session IDs now generated in RAM only (never persisted to AsyncStorage)
- New session ID generated on every app launch
- Sessions rotate automatically every 2 hours (was 30 minutes inactivity)
- Updated documentation URL from /docs/ to /sdk/

### Why This Change?
Storing identifiers on device (AsyncStorage) requires user consent under
ePrivacy Directive Article 5(3). In-memory sessions require no consent, making
Respectlytics designed for consent-free analytics.

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

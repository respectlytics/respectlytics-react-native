/**
 * environment.ts
 * Respectlytics React Native SDK
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

/**
 * True in a development build only (React Native's `__DEV__`). Messages meant
 * for the app's developer, such as dropped property names, are logged there
 * and never in a release build.
 */
export function isDevelopmentBuild(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

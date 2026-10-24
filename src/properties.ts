/**
 * properties.ts
 * Respectlytics React Native SDK
 *
 * Filters event properties on the device with the server's own shape rules,
 * so a property the server could never keep (a bad name, a value that is not
 * a list value, an object) is dropped before the event leaves the device.
 *
 * The SDK does not know which properties an app declared: they are declared
 * in the app's Settings on respectlytics.com, and the server drops the rest.
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import { EventProperties, EventPropertyValue } from './types';

/** The server reads at most the first 20 properties of an event. */
export const MAX_PROPERTIES = 20;

// The server's rules for POST /api/v1/events/ (kept identical in every SDK).
const NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
const VALUE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _.-]{0,39}$/;

export type DropReason =
  | 'invalid name'
  | 'invalid value'
  | 'number not finite'
  | 'unsupported type'
  | 'more than 20'
  | 'not an object';

export interface DroppedProperty {
  /** The property's name; empty when `properties` itself was not an object. */
  name: string;
  reason: DropReason;
}

export interface FilteredProperties {
  /** What passed, in the order given; empty when nothing passed. */
  kept: EventProperties;
  /** What was dropped and why. Values are never recorded. */
  dropped: DroppedProperty[];
}

/**
 * Keep the properties the server could keep, at most 20, and say which names
 * were dropped and why. Accepts anything (JavaScript callers are not held to
 * the TypeScript type) and returns an empty result for `undefined` or `null`.
 */
export function filterProperties(properties: unknown): FilteredProperties {
  const kept: EventProperties = {};
  const dropped: DroppedProperty[] = [];

  if (properties === undefined || properties === null) {
    return { kept, dropped };
  }

  if (typeof properties !== 'object' || Array.isArray(properties)) {
    dropped.push({ name: '', reason: 'not an object' });
    return { kept, dropped };
  }

  let keptCount = 0;
  for (const [name, value] of Object.entries(properties)) {
    const reason = checkProperty(name, value);
    if (reason) {
      dropped.push({ name, reason });
    } else if (keptCount >= MAX_PROPERTIES) {
      dropped.push({ name, reason: 'more than 20' });
    } else {
      kept[name] = value as EventPropertyValue;
      keptCount++;
    }
  }

  return { kept, dropped };
}

/**
 * One log line naming what was dropped from an event and why, never a value.
 */
export function describeDropped(eventName: string, dropped: DroppedProperty[]): string {
  const parts = dropped.map(({ name, reason }) =>
    name === '' ? `properties (${reason})` : `${name} (${reason})`
  );
  return `[Respectlytics] ⚠️ Properties dropped from "${eventName}": ${parts.join(', ')}`;
}

function checkProperty(name: string, value: unknown): DropReason | null {
  if (!NAME_PATTERN.test(name)) {
    return 'invalid name';
  }

  switch (typeof value) {
    case 'string':
      return VALUE_PATTERN.test(value) ? null : 'invalid value';
    case 'number':
      return Number.isFinite(value) ? null : 'number not finite';
    case 'boolean':
      return null;
    default:
      return 'unsupported type';
  }
}

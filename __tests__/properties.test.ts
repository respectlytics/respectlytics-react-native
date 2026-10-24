/**
 * Property filter tests
 * Respectlytics React Native SDK
 *
 * Copyright (c) 2025 Respectlytics. Licensed under MIT.
 */

import {
  MAX_PROPERTIES,
  describeDropped,
  filterProperties,
} from '../src/properties';

describe('filterProperties', () => {
  describe('nothing to filter', () => {
    it('returns nothing for undefined', () => {
      expect(filterProperties(undefined)).toEqual({ kept: {}, dropped: [] });
    });

    it('returns nothing for null', () => {
      expect(filterProperties(null)).toEqual({ kept: {}, dropped: [] });
    });

    it('returns nothing for an empty object', () => {
      expect(filterProperties({})).toEqual({ kept: {}, dropped: [] });
    });
  });

  describe('properties that is not an object', () => {
    it.each([
      ['a string', 'ProductScreen'],
      ['a number', 42],
      ['a boolean', true],
      ['an array', ['paywall', 'b']],
    ])('drops %s as a whole', (_label, value) => {
      expect(filterProperties(value)).toEqual({
        kept: {},
        dropped: [{ name: '', reason: 'not an object' }],
      });
    });
  });

  describe('name rule (^[a-z][a-z0-9_]{0,39}$)', () => {
    it.each(['p', 'paywall', 'ab_test_2', 'a1', 'x'.repeat(40)])(
      'keeps the name %s',
      (name) => {
        expect(filterProperties({ [name]: 'b' }).kept).toEqual({ [name]: 'b' });
      }
    );

    it.each([
      ['an uppercase letter', 'Paywall'],
      ['an uppercase letter inside', 'payWall'],
      ['a leading digit', '1paywall'],
      ['a leading underscore', '_paywall'],
      ['a hyphen', 'pay-wall'],
      ['a space', 'pay wall'],
      ['a dot', 'pay.wall'],
      ['a non-ASCII letter', 'pröva'],
      ['41 characters', 'x'.repeat(41)],
      ['nothing', ''],
      ['a trailing newline', 'paywall\n'],
    ])('drops a name with %s', (_label, name) => {
      expect(filterProperties({ [name]: 'b' })).toEqual({
        kept: {},
        dropped: [{ name, reason: 'invalid name' }],
      });
    });

    it('checks the name before the value', () => {
      expect(filterProperties({ Bad: NaN }).dropped).toEqual([
        { name: 'Bad', reason: 'invalid name' },
      ]);
    });
  });

  describe('string value rule (^[A-Za-z0-9][A-Za-z0-9 _.\\-]{0,39}$)', () => {
    it.each(['b', 'B', '7', 'Variant B', 'v1.2', 'a-b_c.d', 'x'.repeat(40)])(
      'keeps the value %s exactly as given',
      (value) => {
        expect(filterProperties({ paywall: value }).kept).toEqual({ paywall: value });
      }
    );

    it('keeps the case of a value (the server compares case-sensitively)', () => {
      expect(filterProperties({ a: 'B', b: 'b' }).kept).toEqual({ a: 'B', b: 'b' });
    });

    it.each([
      ['nothing', ''],
      ['a leading space', ' b'],
      ['a leading hyphen', '-b'],
      ['a leading dot', '.b'],
      ['a leading underscore', '_b'],
      ['41 characters', 'x'.repeat(41)],
      ['an at sign (an email address)', 'someone@example.com'],
      ['a comma (a sentence)', 'Hello, world'],
      ['a non-ASCII letter', 'Malmö'],
      ['a newline', 'line\nbreak'],
      ['a trailing newline', 'b\n'],
      ['a slash', 'a/b'],
    ])('drops a value with %s', (_label, value) => {
      expect(filterProperties({ paywall: value })).toEqual({
        kept: {},
        dropped: [{ name: 'paywall', reason: 'invalid value' }],
      });
    });
  });

  describe('numbers', () => {
    it.each([0, 1, 7.5, -3, -0.25, 1e6, Number.MAX_SAFE_INTEGER])(
      'keeps the finite number %p',
      (value) => {
        expect(filterProperties({ price: value }).kept).toEqual({ price: value });
      }
    );

    it.each([NaN, Infinity, -Infinity])('drops %p', (value) => {
      expect(filterProperties({ price: value })).toEqual({
        kept: {},
        dropped: [{ name: 'price', reason: 'number not finite' }],
      });
    });
  });

  describe('booleans', () => {
    it('keeps true and false as booleans', () => {
      const { kept } = filterProperties({ trial: true, promo: false });

      expect(kept).toEqual({ trial: true, promo: false });
      expect(typeof kept.trial).toBe('boolean');
      expect(typeof kept.promo).toBe('boolean');
    });
  });

  describe('other types', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['an object', { variant: 'b' }],
      ['an array', ['b']],
      ['a function', () => 'b'],
      ['a bigint', BigInt(5)],
      ['a symbol', Symbol('b')],
      ['a Date', new Date('2026-10-24T00:00:00Z')],
      ['a boxed number', Object(5)],
      ['a boxed string', Object('b')],
    ])('drops %s', (_label, value) => {
      expect(filterProperties({ paywall: value })).toEqual({
        kept: {},
        dropped: [{ name: 'paywall', reason: 'unsupported type' }],
      });
    });
  });

  describe('the limit of 20', () => {
    function validProperties(count: number): Record<string, string> {
      const properties: Record<string, string> = {};
      for (let i = 1; i <= count; i++) {
        properties[`p${i}`] = 'v';
      }
      return properties;
    }

    it('is 20, as on the server', () => {
      expect(MAX_PROPERTIES).toBe(20);
    });

    it('keeps exactly 20', () => {
      const { kept, dropped } = filterProperties(validProperties(20));

      expect(Object.keys(kept)).toHaveLength(20);
      expect(dropped).toEqual([]);
    });

    it('keeps the first 20 and drops the rest', () => {
      const { kept, dropped } = filterProperties(validProperties(25));

      expect(Object.keys(kept)).toEqual(Object.keys(validProperties(20)));
      expect(dropped).toEqual(
        ['p21', 'p22', 'p23', 'p24', 'p25'].map((name) => ({ name, reason: 'more than 20' }))
      );
    });

    it('does not count dropped properties toward the limit', () => {
      const properties = { Bad: 'v', email: 'someone@example.com', ...validProperties(20) };

      const { kept, dropped } = filterProperties(properties);

      expect(Object.keys(kept)).toHaveLength(20);
      expect(dropped).toEqual([
        { name: 'Bad', reason: 'invalid name' },
        { name: 'email', reason: 'invalid value' },
      ]);
    });
  });

  describe('a mix', () => {
    const properties = {
      paywall: 'b',
      price: 7.5,
      trial: true,
      Email: 'b',
      note: 'free text, with a comma',
      ratio: NaN,
      meta: { nested: 'b' },
    };

    it('keeps what passes, in the order given', () => {
      const { kept } = filterProperties(properties);

      expect(kept).toEqual({ paywall: 'b', price: 7.5, trial: true });
      expect(Object.keys(kept)).toEqual(['paywall', 'price', 'trial']);
    });

    it('names each dropped property with its reason', () => {
      expect(filterProperties(properties).dropped).toEqual([
        { name: 'Email', reason: 'invalid name' },
        { name: 'note', reason: 'invalid value' },
        { name: 'ratio', reason: 'number not finite' },
        { name: 'meta', reason: 'unsupported type' },
      ]);
    });

    it('never records a dropped value', () => {
      const recorded = JSON.stringify(filterProperties(properties).dropped);

      expect(recorded).not.toContain('free text');
      expect(recorded).not.toContain('nested');
    });

    it('does not change the object it was given', () => {
      const copy = { ...properties };

      filterProperties(properties);

      expect(properties).toEqual(copy);
    });
  });
});

describe('describeDropped', () => {
  it('names the event, each dropped name and its reason', () => {
    expect(
      describeDropped('paywall_viewed', [
        { name: 'Email', reason: 'invalid name' },
        { name: 'note', reason: 'invalid value' },
      ])
    ).toBe(
      '[Respectlytics] ⚠️ Properties dropped from "paywall_viewed": Email (invalid name), note (invalid value)'
    );
  });

  it('says when properties was not an object', () => {
    expect(describeDropped('purchase', [{ name: '', reason: 'not an object' }])).toBe(
      '[Respectlytics] ⚠️ Properties dropped from "purchase": properties (not an object)'
    );
  });
});

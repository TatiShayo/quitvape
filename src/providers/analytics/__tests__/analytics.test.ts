import { AnalyticsEvent, BLOCKED_KEY, scrub } from '../index';

describe('Analytics telemetry privacy scrubber', () => {
  it('blocks sensitive keys like relapse, craving, trigger, mood, money, health', () => {
    const rawProps = {
      plan_name: 'weekly',
      relapse_count: 2,
      craving_intensity: 5,
      trigger: 'stress',
      quit_date: '2026-08-01',
      mood: 4,
      note: 'secret thoughts',
      body: 'message body',
      medical_status: 'recovering',
      puff_count: 10,
      vape_cost: 35,
      dollar_amount: 100,
    };

    const scrubbed = scrub(rawProps);
    expect(scrubbed).toEqual({
      plan_name: 'weekly',
    });
  });

  it('matches all forbidden keys in the BLOCKED_KEY pattern', () => {
    const forbiddenKeys = [
      'relapse',
      'craving',
      'trigger',
      'quit_date',
      'quitdate',
      'streak_start',
      'mood',
      'handle',
      'anon',
      'note',
      'body',
      'message',
      'text',
      'content',
      'comment',
      'input',
      'prompt',
      'email',
      'phone',
      'address',
      'ssn',
      'token',
      'secret',
      'medical',
      'health',
      'puff',
      'spend',
      'cost',
      'dollar',
      'money',
      'price',
      'amount',
    ];

    for (const k of forbiddenKeys) {
      expect(BLOCKED_KEY.test(k)).toBe(true);
      expect(BLOCKED_KEY.test(k.toUpperCase())).toBe(true);
      expect(BLOCKED_KEY.test(`user_${k}_info`)).toBe(true);
    }
  });

  it('filters out strings containing email addresses or phone numbers', () => {
    const rawProps = {
      screen_name: 'home',
      user_feedback: 'contact me at test.user@example.com for info',
      support_call: 'call 555-123-4567 immediately',
    };

    const scrubbed = scrub(rawProps);
    expect(scrubbed).toEqual({
      screen_name: 'home',
    });
  });

  it('truncates excessively long string values to prevent payload leaks', () => {
    const rawProps = {
      card_type: 'a'.repeat(120),
    };

    const scrubbed = scrub(rawProps);
    expect(scrubbed?.card_type).toBe('a'.repeat(64));
  });

  it('preserves safe primitives (booleans, numbers, valid short strings)', () => {
    const rawProps = {
      screen_index: 2,
      is_trial: true,
      category: 'onboarding',
    };

    const scrubbed = scrub(rawProps);
    expect(scrubbed).toEqual({
      screen_index: 2,
      is_trial: true,
      category: 'onboarding',
    });
  });

  it('drops undefined, null, NaN, and Infinity', () => {
    const rawProps = {
      step: 1,
      extra: undefined,
      nullVal: null as unknown as string,
      badNum: NaN,
      infNum: Infinity,
    };

    const scrubbed = scrub(rawProps);
    expect(scrubbed).toEqual({
      step: 1,
    });
  });

  it('returns undefined if all props are stripped or empty', () => {
    expect(scrub(undefined)).toBeUndefined();
    expect(scrub({})).toBeUndefined();
    expect(scrub({ relapse_trigger: 'stress' })).toBeUndefined();
  });
});

describe('AnalyticsEvent dictionary', () => {
  it('has valid snake_case event names', () => {
    for (const [key, eventName] of Object.entries(AnalyticsEvent)) {
      expect(typeof eventName).toBe('string');
      expect(eventName).toMatch(/^[a-z]+(_[a-z]+)*$/);
      expect(key.length).toBeGreaterThan(0);
    }
  });
});

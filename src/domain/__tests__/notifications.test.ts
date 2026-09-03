import {
  generateCompleteNotificationPlan,
  parseTimeHHMM,
  SchedulePlanInput,
} from '../notifications';
import { CravingEvent } from '../types';

describe('parseTimeHHMM', () => {
  it('parses valid HH:mm strings', () => {
    expect(parseTimeHHMM('08:30')).toEqual({ hour: 8, minute: 30 });
    expect(parseTimeHHMM('00:00')).toEqual({ hour: 0, minute: 0 });
    expect(parseTimeHHMM('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(parseTimeHHMM(' 07:15 ')).toEqual({ hour: 7, minute: 15 });
  });

  it('falls back on invalid strings or out of bounds values', () => {
    expect(parseTimeHHMM('25:00', 8, 0)).toEqual({ hour: 8, minute: 0 });
    expect(parseTimeHHMM('12:70', 9, 15)).toEqual({ hour: 9, minute: 15 });
    expect(parseTimeHHMM('abc', 8, 0)).toEqual({ hour: 8, minute: 0 });
    expect(parseTimeHHMM(undefined, 8, 0)).toEqual({ hour: 8, minute: 0 });
    expect(parseTimeHHMM('', 8, 0)).toEqual({ hour: 8, minute: 0 });
    expect(parseTimeHHMM('12:00:00', 8, 0)).toEqual({ hour: 8, minute: 0 });
    expect(parseTimeHHMM('-1:00', 8, 0)).toEqual({ hour: 8, minute: 0 });
  });
});

describe('generateCompleteNotificationPlan', () => {
  const baseInput: SchedulePlanInput = {
    prefs: {
      morningMotivation: true,
      eveningCheckIn: true,
      milestones: true,
      dangerHour: true,
      weeklyReport: true,
      buddy: true,
      morningTime: '08:00',
    },
    streakStart: new Date('2026-08-14T00:00:00.000Z'),
    streakDays: 0,
    cravings: [],
    now: new Date('2026-08-14T10:00:00.000Z'),
  };

  it('schedules morning, evening, weekly report, and next milestone when all enabled', () => {
    const plan = generateCompleteNotificationPlan(baseInput);

    const morning = plan.find((p) => p.category === 'morning');
    const evening = plan.find((p) => p.category === 'evening');
    const weekly = plan.find((p) => p.category === 'weeklyReport');
    const milestone = plan.find((p) => p.category === 'milestone');

    expect(morning).toBeDefined();
    expect(morning?.dailyTrigger).toEqual({ hour: 8, minute: 0 });

    expect(evening).toBeDefined();
    expect(evening?.dailyTrigger).toEqual({ hour: 20, minute: 0 });

    expect(weekly).toBeDefined();
    expect(weekly?.weeklyTrigger).toEqual({ weekday: 1, hour: 18, minute: 0 });

    expect(milestone).toBeDefined();
    expect(milestone?.identifier).toBe('qv-milestone-1'); // Next milestone from 0 days is 1
  });

  it('schedules custom morning push time', () => {
    const input: SchedulePlanInput = {
      ...baseInput,
      prefs: {
        ...baseInput.prefs,
        morningTime: '06:45',
      },
    };

    const plan = generateCompleteNotificationPlan(input);
    const morning = plan.find((p) => p.category === 'morning');
    expect(morning?.dailyTrigger).toEqual({ hour: 6, minute: 45 });
  });

  it('schedules danger hour proactive ping when enough cravings logged', () => {
    const cravings: CravingEvent[] = [
      { ts: new Date(2026, 7, 14, 21, 0, 0).toISOString(), intensity: 3, trigger: 'stress', resisted: true },
      { ts: new Date(2026, 7, 14, 21, 15, 0).toISOString(), intensity: 4, trigger: 'stress', resisted: true },
      { ts: new Date(2026, 7, 14, 21, 45, 0).toISOString(), intensity: 4, trigger: 'stress', resisted: true },
    ];

    const input: SchedulePlanInput = {
      ...baseInput,
      cravings,
    };

    const plan = generateCompleteNotificationPlan(input);
    const danger = plan.find((p) => p.category === 'dangerHour');

    expect(danger).toBeDefined();
    // 21:00 danger hour minus 15 min lead time = 20:45
    expect(danger?.dailyTrigger).toEqual({ hour: 20, minute: 45 });
  });

  it('schedules next milestone accurately based on current streak days', () => {
    const input: SchedulePlanInput = {
      ...baseInput,
      streakStart: new Date('2026-08-01T00:00:00.000Z'),
      streakDays: 8, // 7-day milestone passed, next is 14
      now: new Date('2026-08-09T00:00:00.000Z'),
    };

    const plan = generateCompleteNotificationPlan(input);
    const milestone = plan.find((p) => p.category === 'milestone');

    expect(milestone).toBeDefined();
    expect(milestone?.identifier).toBe('qv-milestone-14');
  });

  it('omits milestone when all milestones are passed or fireAt is in the past', () => {
    const input: SchedulePlanInput = {
      ...baseInput,
      streakStart: new Date('2024-01-01T00:00:00.000Z'),
      streakDays: 400, // beyond 365
      now: new Date('2026-08-14T00:00:00.000Z'),
    };

    const plan = generateCompleteNotificationPlan(input);
    expect(plan.some((p) => p.category === 'milestone')).toBe(false);
  });

  it('respects toggled off preferences', () => {
    const input: SchedulePlanInput = {
      ...baseInput,
      prefs: {
        ...baseInput.prefs,
        morningMotivation: false,
        eveningCheckIn: false,
        milestones: false,
        dangerHour: false,
        weeklyReport: false,
      },
    };

    const plan = generateCompleteNotificationPlan(input);
    expect(plan).toHaveLength(0);
  });
});

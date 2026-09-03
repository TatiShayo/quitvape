import { useQuitStore } from '../quitStore';
import { QuitPlan } from '@/domain/types';

describe('useQuitStore', () => {
  beforeEach(() => {
    useQuitStore.getState().resetAll();
  });

  const samplePlan: QuitPlan = {
    method: 'cold_turkey',
    streakStart: '2026-08-14T00:00:00.000Z',
    originalQuitDate: '2026-08-14T00:00:00.000Z',
    baselinePuffsPerDay: 150,
    vapeCostPerWeek: 35,
    dependencyScore: 6.0,
    reasons: ['health'],
  };

  it('starts with null plan and empty logs', () => {
    const state = useQuitStore.getState();
    expect(state.plan).toBeNull();
    expect(state.relapses).toEqual([]);
    expect(state.cravings).toEqual([]);
    expect(state.checkIns).toEqual([]);
    expect(state.achievementsUnlocked).toEqual([]);
    expect(state.puffLog).toEqual({});
  });

  it('initializes plan correctly on startPlan', () => {
    useQuitStore.getState().startPlan(samplePlan);
    const state = useQuitStore.getState();
    expect(state.plan).toEqual(samplePlan);
  });

  it('resets streakStart and records relapse in logRelapse', () => {
    useQuitStore.getState().startPlan(samplePlan);
    const relapseTime = new Date('2026-08-15T15:30:00.000Z');
    useQuitStore.getState().logRelapse('stress', relapseTime);

    const state = useQuitStore.getState();
    expect(state.relapses.length).toBe(1);
    expect(state.relapses[0].trigger).toBe('stress');
    expect(state.relapses[0].ts).toBe(relapseTime.toISOString());
    expect(state.plan?.streakStart).toBe(relapseTime.toISOString());
    expect(state.plan?.originalQuitDate).toBe(samplePlan.originalQuitDate); // Preserved
  });

  it('no-ops logRelapse if plan is null', () => {
    useQuitStore.getState().logRelapse('stress');
    expect(useQuitStore.getState().relapses).toEqual([]);
  });

  it('logs cravings with clamped intensity (1..10)', () => {
    useQuitStore.getState().startPlan(samplePlan);
    const now = new Date('2026-08-14T12:00:00.000Z');

    useQuitStore.getState().logCraving({ intensity: 4, trigger: 'social', resisted: true }, now);
    useQuitStore.getState().logCraving({ intensity: 15, trigger: 'boredom', resisted: false }, now); // Clamped to 10
    useQuitStore.getState().logCraving({ intensity: 0, trigger: 'other', resisted: true }, now); // Clamped to 1

    const state = useQuitStore.getState();
    expect(state.cravings.length).toBe(3);
    expect(state.cravings[0].intensity).toBe(4);
    expect(state.cravings[0].trigger).toBe('social');
    expect(state.cravings[0].resisted).toBe(true);
    expect(state.cravings[1].intensity).toBe(10);
    expect(state.cravings[2].intensity).toBe(1);
  });

  it('updates check-in for the current day idempotently (latest wins for same day)', () => {
    const day1 = new Date('2026-08-14T09:00:00.000Z');
    const day1Later = new Date('2026-08-14T20:00:00.000Z');

    useQuitStore.getState().submitCheckIn(3, day1);
    expect(useQuitStore.getState().checkIns.length).toBe(1);
    expect(useQuitStore.getState().checkIns[0].mood).toBe(3);

    useQuitStore.getState().submitCheckIn(5, day1Later);
    expect(useQuitStore.getState().checkIns.length).toBe(1);
    expect(useQuitStore.getState().checkIns[0].mood).toBe(5);
  });

  it('increments and tracks taper puff counts per day', () => {
    const day = new Date('2026-08-14T10:00:00.000Z');
    expect(useQuitStore.getState().puffsToday(day)).toBe(0);

    useQuitStore.getState().logPuff(day);
    useQuitStore.getState().logPuff(day);
    expect(useQuitStore.getState().puffsToday(day)).toBe(2);
  });

  it('unlocks achievements idempotently and rejects empty ids', () => {
    useQuitStore.getState().unlockAchievement('day_1');
    useQuitStore.getState().unlockAchievement('day_1');
    useQuitStore.getState().unlockAchievement('hour_72');
    useQuitStore.getState().unlockAchievement('');

    expect(useQuitStore.getState().achievementsUnlocked).toEqual(['day_1', 'hour_72']);
  });

  it('updates spend and quit date safely', () => {
    useQuitStore.getState().startPlan(samplePlan);
    useQuitStore.getState().updateSpend(60);
    expect(useQuitStore.getState().plan?.vapeCostPerWeek).toBe(60);

    useQuitStore.getState().updateSpend(NaN);
    expect(useQuitStore.getState().plan?.vapeCostPerWeek).toBe(60);

    const newDate = '2026-08-01T00:00:00.000Z';
    useQuitStore.getState().updateQuitDate(newDate);
    expect(useQuitStore.getState().plan?.streakStart).toBe(newDate);

    // Rejects invalid date strings
    useQuitStore.getState().updateQuitDate('invalid');
    expect(useQuitStore.getState().plan?.streakStart).toBe(newDate);
  });

  it('imports data replacing current state completely', () => {
    useQuitStore.getState().startPlan(samplePlan);
    const importedPlan: QuitPlan = {
      ...samplePlan,
      baselinePuffsPerDay: 300,
    };
    useQuitStore.getState().importData({
      plan: importedPlan,
      relapses: [{ ts: '2026-08-10T00:00:00.000Z', trigger: 'drinking' }],
      cravings: [],
      checkIns: [],
      achievementsUnlocked: ['day_1'],
      puffLog: {},
    });

    const state = useQuitStore.getState();
    expect(state.plan?.baselinePuffsPerDay).toBe(300);
    expect(state.relapses.length).toBe(1);
    expect(state.achievementsUnlocked).toEqual(['day_1']);
  });
});

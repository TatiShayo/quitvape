import { makeMigrate } from '../persist';

/**
 * REVIEW_FINDINGS H3 — the migration guard is the single defense against silently
 * wiping the user's quit date/streak/relapses on a persist version bump. These lock in
 * the "carry forward, never drop" contract so a future edit can't quietly regress it.
 */
describe('makeMigrate', () => {
  const defaults = { plan: null as string | null, relapses: [] as number[], flag: false };

  it('returns defaults for a null/undefined payload instead of throwing', () => {
    expect(makeMigrate(defaults)(null)).toEqual(defaults);
    expect(makeMigrate(defaults)(undefined)).toEqual(defaults);
  });

  it('returns defaults for a non-object payload (corrupt storage)', () => {
    expect(makeMigrate(defaults)('garbage')).toEqual(defaults);
    expect(makeMigrate(defaults)(42)).toEqual(defaults);
  });

  it('carries known persisted fields forward on top of defaults', () => {
    const persisted = { plan: 'q1', relapses: [1, 2], flag: true };
    expect(makeMigrate(defaults)(persisted)).toEqual(persisted);
  });

  it('fills missing fields from defaults (older/partial payload)', () => {
    const out = makeMigrate(defaults)({ plan: 'q1' });
    expect(out).toEqual({ plan: 'q1', relapses: [], flag: false });
  });

  it('drops unknown fields not present in the current shape', () => {
    const out = makeMigrate(defaults)({ plan: 'q1', legacyField: 'x' });
    expect(out).not.toHaveProperty('legacyField');
  });

  it('preserves a legitimately-falsy persisted value (e.g. flag:false, empty list)', () => {
    const out = makeMigrate({ flag: true, relapses: [1] })({ flag: false, relapses: [] });
    expect(out).toEqual({ flag: false, relapses: [] });
  });

  it('does not mutate the shared defaults object across calls', () => {
    const m = makeMigrate(defaults);
    m({ plan: 'a', relapses: [9] });
    expect(defaults).toEqual({ plan: null, relapses: [], flag: false });
  });
});

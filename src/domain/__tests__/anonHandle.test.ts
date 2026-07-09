import { generateAnonHandle, randomAnonHandle } from '../anonHandle';

describe('generateAnonHandle', () => {
  it('is deterministic for the same seed', () => {
    expect(generateAnonHandle('user-123')).toBe(generateAnonHandle('user-123'));
  });

  it('produces "AdjectiveNoun##"-style handles', () => {
    expect(generateAnonHandle('user-123')).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d{1,2}$/);
  });

  it('differs across distinct seeds (spot check, not a uniqueness guarantee)', () => {
    const seeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const handles = new Set(seeds.map(generateAnonHandle));
    expect(handles.size).toBeGreaterThan(1);
  });
});

describe('randomAnonHandle', () => {
  it('produces a validly-shaped handle', () => {
    expect(randomAnonHandle()).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d{1,2}$/);
  });
});

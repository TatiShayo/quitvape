import { useOnboardingStore } from '../onboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().clear();
    useOnboardingStore.setState({ ageConfirmed: false, furthestScreen: 0, answers: {} });
  });

  it('initializes with default empty state', () => {
    const state = useOnboardingStore.getState();
    expect(state.answers).toEqual({});
    expect(state.furthestScreen).toBe(0);
    expect(state.ageConfirmed).toBe(false);
  });

  it('updates answers individually with type safety', () => {
    useOnboardingStore.getState().setAnswer('ageRange', '25-34');
    useOnboardingStore.getState().setAnswer('puffsPerDay', 200);
    useOnboardingStore.getState().setAnswer('vapeCostPerWeek', 45);
    useOnboardingStore.getState().setAnswer('method', 'taper');
    useOnboardingStore.getState().setAnswer('reasons', ['health', 'money']);
    useOnboardingStore.getState().setAnswer('firstPuffOnWaking', true);

    const state = useOnboardingStore.getState();
    expect(state.answers.ageRange).toBe('25-34');
    expect(state.answers.puffsPerDay).toBe(200);
    expect(state.answers.vapeCostPerWeek).toBe(45);
    expect(state.answers.method).toBe('taper');
    expect(state.answers.reasons).toEqual(['health', 'money']);
    expect(state.answers.firstPuffOnWaking).toBe(true);
  });

  it('marks furthestScreen monotonically (never decreases)', () => {
    useOnboardingStore.getState().markScreen(3);
    expect(useOnboardingStore.getState().furthestScreen).toBe(3);

    useOnboardingStore.getState().markScreen(1);
    expect(useOnboardingStore.getState().furthestScreen).toBe(3); // stays 3

    useOnboardingStore.getState().markScreen(7);
    expect(useOnboardingStore.getState().furthestScreen).toBe(7);
  });

  it('confirms age gate', () => {
    expect(useOnboardingStore.getState().ageConfirmed).toBe(false);
    useOnboardingStore.getState().confirmAge();
    expect(useOnboardingStore.getState().ageConfirmed).toBe(true);
  });

  it('clears answers and screen index on clear()', () => {
    useOnboardingStore.getState().setAnswer('yearsVaping', 4);
    useOnboardingStore.getState().markScreen(5);
    useOnboardingStore.getState().clear();

    const state = useOnboardingStore.getState();
    expect(state.answers).toEqual({});
    expect(state.furthestScreen).toBe(0);
  });
});

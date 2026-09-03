import { useSettingsStore } from '../settingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  it('initializes with default notification preferences and flags', () => {
    const state = useSettingsStore.getState();
    expect(state.notifications.morningMotivation).toBe(true);
    expect(state.notifications.eveningCheckIn).toBe(true);
    expect(state.notifications.milestones).toBe(true);
    expect(state.notifications.dangerHour).toBe(true);
    expect(state.notifications.weeklyReport).toBe(true);
    expect(state.notifications.buddy).toBe(true);
    expect(state.notifications.morningTime).toBe('08:00');
    expect(state.cachedPremium).toBe(false);
    expect(state.reviewPrompted).toBe(false);
    expect(state.lastSeenBuddyStreakDays).toBeUndefined();
  });

  it('updates notification preferences independently', () => {
    useSettingsStore.getState().setNotificationPref('morningMotivation', false);
    useSettingsStore.getState().setNotificationPref('morningTime', '07:30');
    useSettingsStore.getState().setNotificationPref('dangerHour', false);

    const { notifications } = useSettingsStore.getState();
    expect(notifications.morningMotivation).toBe(false);
    expect(notifications.morningTime).toBe('07:30');
    expect(notifications.dangerHour).toBe(false);
    expect(notifications.eveningCheckIn).toBe(true); // untouched
  });

  it('updates cachedPremium flag', () => {
    useSettingsStore.getState().setCachedPremium(true);
    expect(useSettingsStore.getState().cachedPremium).toBe(true);

    useSettingsStore.getState().setCachedPremium(false);
    expect(useSettingsStore.getState().cachedPremium).toBe(false);
  });

  it('marks reviewPrompted flag permanently until reset', () => {
    expect(useSettingsStore.getState().reviewPrompted).toBe(false);
    useSettingsStore.getState().markReviewPrompted();
    expect(useSettingsStore.getState().reviewPrompted).toBe(true);
  });

  it('tracks last seen buddy streak days', () => {
    useSettingsStore.getState().setLastSeenBuddyStreakDays(14);
    expect(useSettingsStore.getState().lastSeenBuddyStreakDays).toBe(14);
  });

  it('resets all preferences and state to defaults', () => {
    useSettingsStore.getState().setNotificationPref('milestones', false);
    useSettingsStore.getState().setCachedPremium(true);
    useSettingsStore.getState().markReviewPrompted();
    useSettingsStore.getState().setLastSeenBuddyStreakDays(30);

    useSettingsStore.getState().reset();

    const state = useSettingsStore.getState();
    expect(state.notifications.milestones).toBe(true);
    expect(state.cachedPremium).toBe(false);
    expect(state.reviewPrompted).toBe(false);
    expect(state.lastSeenBuddyStreakDays).toBeUndefined();
  });
});

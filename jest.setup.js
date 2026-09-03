/* eslint-disable @typescript-eslint/no-require-imports */
// Global Jest setup for React Native & Expo testing

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('posthog-react-native', () => {
  return jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    screen: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  }));
});

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
}));

jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  logIn: jest.fn(),
  getOfferings: jest.fn(),
  getCustomerInfo: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn(),
  removeCustomerInfoUpdateListener: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  scheduleNotificationAsync: jest.fn(async () => 'mock-notification-id'),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    DATE: 'date',
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path, options) => {
    const qs = options?.queryParams
      ? '?' + new URLSearchParams(options.queryParams).toString()
      : '';
    return `quitvape://${path}${qs}`;
  }),
  openURL: jest.fn(async () => {}),
}));

jest.mock('expo-store-review', () => ({
  hasAction: jest.fn(async () => true),
  requestReview: jest.fn(async () => {}),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(async () => 'file:///tmp/mock-share.png'),
}));

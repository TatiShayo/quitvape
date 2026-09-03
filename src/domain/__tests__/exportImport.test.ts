import {
  APP_IDENTIFIER,
  createExportPayload,
  EXPORT_SCHEMA_VERSION,
  ExportData,
  validateAndSanitizeImport,
} from '../exportImport';

describe('createExportPayload', () => {
  const sampleData: ExportData = {
    plan: {
      method: 'cold_turkey',
      streakStart: '2026-08-10T12:00:00.000Z',
      originalQuitDate: '2026-08-10T12:00:00.000Z',
      baselinePuffsPerDay: 150,
      vapeCostPerWeek: 35,
      dependencyScore: 6.2,
      reasons: ['health', 'money'],
    },
    relapses: [{ ts: '2026-08-12T18:00:00.000Z', trigger: 'stress' }],
    cravings: [
      { ts: '2026-08-11T09:00:00.000Z', intensity: 3, trigger: 'stress', resisted: true },
      { ts: '2026-08-12T15:00:00.000Z', intensity: 4, trigger: 'social', resisted: false },
    ],
    checkIns: [
      { date: '2026-08-10', mood: 4 },
      { date: '2026-08-11', mood: 3 },
    ],
    achievementsUnlocked: ['day_1', 'hour_72'],
    puffLog: { '2026-08-10': 0 },
    notificationPrefs: {
      morningMotivation: true,
      eveningCheckIn: true,
      milestones: true,
      dangerHour: true,
      weeklyReport: true,
      buddy: false,
      morningTime: '07:30',
    },
  };

  it('generates valid JSON with required metadata', () => {
    const jsonStr = createExportPayload(sampleData);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.app).toBe(APP_IDENTIFIER);
    expect(parsed.version).toBe(EXPORT_SCHEMA_VERSION);
    expect(typeof parsed.exportedAt).toBe('string');
    expect(parsed.data.plan.baselinePuffsPerDay).toBe(150);
    expect(parsed.data.cravings.length).toBe(2);
    expect(parsed.data.notificationPrefs.morningTime).toBe('07:30');
  });

  it('handles null plan in export payload', () => {
    const jsonStr = createExportPayload({ ...sampleData, plan: null });
    const parsed = JSON.parse(jsonStr);
    expect(parsed.data.plan).toBeNull();
  });
});

describe('validateAndSanitizeImport', () => {
  const validData: ExportData = {
    plan: {
      method: 'taper',
      streakStart: '2026-08-01T00:00:00.000Z',
      originalQuitDate: '2026-08-01T00:00:00.000Z',
      baselinePuffsPerDay: 200,
      vapeCostPerWeek: 50,
      dependencyScore: 7.5,
      reasons: ['freedom'],
      taperWeeklyReduction: 0.15,
    },
    relapses: [],
    cravings: [
      { ts: '2026-08-02T14:00:00.000Z', intensity: 4, trigger: 'boredom', resisted: true },
    ],
    checkIns: [{ date: '2026-08-01', mood: 5 }],
    achievementsUnlocked: ['day_1'],
    puffLog: { '2026-08-01': 10 },
  };

  it('validates and accepts a perfect export payload', () => {
    const jsonStr = createExportPayload(validData);
    const result = validateAndSanitizeImport(jsonStr);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.plan?.method).toBe('taper');
      expect(result.data.cravings.length).toBe(1);
      expect(result.data.checkIns[0].mood).toBe(5);
    }
  });

  it('rejects corrupted or non-JSON input', () => {
    expect(validateAndSanitizeImport('')).toEqual({
      success: false,
      error: 'Empty or invalid import file.',
    });
    expect(validateAndSanitizeImport('   ')).toEqual({
      success: false,
      error: 'Empty or invalid import file.',
    });
    expect(validateAndSanitizeImport('not a json { [')).toEqual({
      success: false,
      error: 'JSON parse error: file is corrupted or not valid JSON.',
    });
    expect(validateAndSanitizeImport('123')).toEqual({
      success: false,
      error: 'Invalid backup format: root must be an object.',
    });
    expect(validateAndSanitizeImport('null')).toEqual({
      success: false,
      error: 'Invalid backup format: root must be an object.',
    });
  });

  it('rejects payloads from different apps or future schema versions or missing data section', () => {
    const wrongApp = JSON.stringify({
      app: 'AnotherQuitApp',
      version: 1,
      data: {},
    });
    expect(validateAndSanitizeImport(wrongApp).success).toBe(false);

    const futureVersion = JSON.stringify({
      app: APP_IDENTIFIER,
      version: 999,
      data: {},
    });
    expect(validateAndSanitizeImport(futureVersion).success).toBe(false);

    const missingData = JSON.stringify({
      app: APP_IDENTIFIER,
      version: 1,
    });
    expect(validateAndSanitizeImport(missingData).success).toBe(false);
  });

  it('sanitizes and clamps out-of-range data and recovers valid plan with fallback defaults', () => {
    const dirty = JSON.stringify({
      app: APP_IDENTIFIER,
      version: 1,
      exportedAt: '2026-08-14T00:00:00.000Z',
      data: {
        plan: {
          method: 'invalid_method',
          streakStart: '2026-08-01T00:00:00.000Z',
          baselinePuffsPerDay: -100, // should clamp/default to 150
          vapeCostPerWeek: -20, // should clamp to 0
          dependencyScore: 99, // should clamp to 10
          reasons: ['invalid_reason', 'health'],
        },
        cravings: [
          { ts: '2026-08-01T12:00:00.000Z', intensity: 100, trigger: 'stress', resisted: true }, // clamp intensity
          { ts: 'invalid-date', intensity: 2, trigger: 'stress', resisted: true }, // drop invalid ts
        ],
        checkIns: [
          { date: '2026-08-01', mood: 10 }, // clamp mood to 5
          { date: 'bad-date', mood: 3 }, // drop bad date
        ],
        achievementsUnlocked: ['day_1', '', 'day_1'], // dedupe and remove empty
        puffLog: {
          '2026-08-01': 5,
          'invalid-date': 10,
        },
        notificationPrefs: {
          morningTime: 'invalid-time',
          morningMotivation: true,
        },
      },
    });

    const result = validateAndSanitizeImport(dirty);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.plan?.method).toBe('cold_turkey');
      expect(result.data.plan?.baselinePuffsPerDay).toBe(150);
      expect(result.data.plan?.vapeCostPerWeek).toBe(0);
      expect(result.data.plan?.dependencyScore).toBe(10);
      expect(result.data.plan?.reasons).toEqual(['health']);

      // Cravings clamped
      expect(result.data.cravings.length).toBe(1);
      expect(result.data.cravings[0].intensity).toBe(10);

      // CheckIns clamped
      expect(result.data.checkIns.length).toBe(1);
      expect(result.data.checkIns[0].mood).toBe(5);

      // Achievements deduped
      expect(result.data.achievementsUnlocked).toEqual(['day_1']);

      // PuffLog filtered
      expect(result.data.puffLog).toEqual({ '2026-08-01': 5 });

      // Notification prefs sanitized
      expect(result.data.notificationPrefs?.morningTime).toBe('08:00');
    }
  });
});

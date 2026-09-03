import {
  HEALTH_METRICS,
  calculateHealthMilestones,
  getOverallHealthScore,
} from "../health";
import { MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY } from "../time";

describe("QuitVape Health Milestone Triggers & Invariants", () => {
  it("strictly reports 0% progress at t=0", () => {
    const milestones = calculateHealthMilestones(0);
    for (const m of milestones) {
      expect(m.progress).toBe(0);
      expect(m.isCompleted).toBe(false);
      expect(m.remainingMs).toBe(m.targetMs);
    }
  });

  it("marks 20-minute heart rate milestone completed after 21 minutes", () => {
    const elapsed = 21 * MS_PER_MINUTE;
    const milestones = calculateHealthMilestones(elapsed);
    const hr = milestones.find((m) => m.id === "heart_rate");

    expect(hr).toBeDefined();
    expect(hr?.isCompleted).toBe(true);
    expect(hr?.progress).toBe(1);
    expect(hr?.remainingMs).toBe(0);
  });

  it("marks 24-hour nicotine expulsion milestone completed at 24 hours", () => {
    const elapsed = 24 * MS_PER_HOUR;
    const milestones = calculateHealthMilestones(elapsed);
    const nic = milestones.find((m) => m.id === "nicotine_expulsion");

    expect(nic).toBeDefined();
    expect(nic?.isCompleted).toBe(true);
    expect(nic?.progress).toBe(1);
  });

  it("guarantees progress monotonicity: progress never drops as time increases", () => {
    const t1 = calculateHealthMilestones(10 * MS_PER_HOUR);
    const t2 = calculateHealthMilestones(20 * MS_PER_HOUR);
    const t3 = calculateHealthMilestones(40 * MS_PER_HOUR);

    for (let i = 0; i < t1.length; i++) {
      expect(t2[i].progress).toBeGreaterThanOrEqual(t1[i].progress);
      expect(t3[i].progress).toBeGreaterThanOrEqual(t2[i].progress);
    }
  });

  it("clamps progress to at most 1.0 even with huge elapsed time (10 years)", () => {
    const hugeElapsed = 10 * 365 * MS_PER_DAY;
    const milestones = calculateHealthMilestones(hugeElapsed);

    for (const m of milestones) {
      expect(m.progress).toBe(1.0);
      expect(m.isCompleted).toBe(true);
      expect(m.remainingMs).toBe(0);
    }
  });
});

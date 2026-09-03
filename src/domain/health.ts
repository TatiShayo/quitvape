/**
 * Health recovery math and physiology milestones. Pure functions over elapsed time.
 * Provides granular progress percentages (0-100%), smooth progression curves,
 * category breakdowns (cardiovascular, respiratory, neurological), and next-milestone forecasting.
 */
import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from './time';

export type HealthCategory = 'cardiovascular' | 'respiratory' | 'neurological' | 'sensory';

export interface HealthMetricDef {
  id: string;
  category: HealthCategory;
  targetMs: number;
  timeLabel: string;
  title: string;
  description: string;
  clinicalSource: string;
}

export const HEALTH_METRICS: HealthMetricDef[] = [
  {
    id: 'heart_rate',
    category: 'cardiovascular',
    targetMs: 20 * MS_PER_MINUTE,
    timeLabel: '20 minutes',
    title: 'Heart Rate & Blood Pressure Drop',
    description: 'Pulse rate and arterial blood pressure begin returning toward baseline levels.',
    clinicalSource: 'American Cancer Society, "Health Benefits of Quitting Smoking Over Time"',
  },
  {
    id: 'blood_oxygen',
    category: 'cardiovascular',
    targetMs: 8 * MS_PER_HOUR,
    timeLabel: '8 hours',
    title: 'Blood Oxygen Levels Normalize',
    description: 'Carbon monoxide in the bloodstream clears and cellular oxygen levels return to normal.',
    clinicalSource: 'CDC, "Smoking Cessation: Fast Facts"',
  },
  {
    id: 'nicotine_expulsion',
    category: 'neurological',
    targetMs: 24 * MS_PER_HOUR,
    timeLabel: '24 hours',
    title: 'Nicotine Cleared from Bloodstream',
    description: 'Over 90% of circulating nicotine and its primary metabolites have been metabolized and excreted.',
    clinicalSource: 'National Institute on Drug Abuse (NIDA), "Nicotine and Tobacco"',
  },
  {
    id: 'taste_and_smell',
    category: 'sensory',
    targetMs: 48 * MS_PER_HOUR,
    timeLabel: '48 hours',
    title: 'Taste and Smell Nerve Regeneration',
    description: 'Damaged sensory nerve endings begin regrowing. Olfactory and gustatory acuity noticeably improves.',
    clinicalSource: 'American Lung Association, "What Happens When You Quit"',
  },
  {
    id: 'breathing_ease',
    category: 'respiratory',
    targetMs: 72 * MS_PER_HOUR,
    timeLabel: '72 hours',
    title: 'Bronchial Relaxation',
    description: 'Bronchial tubes relax, airway resistance drops, and lung functional capacity starts expanding.',
    clinicalSource: 'American Lung Association, "What Happens When You Quit"',
  },
  {
    id: 'circulation_boost',
    category: 'cardiovascular',
    targetMs: 14 * MS_PER_DAY,
    timeLabel: '2 weeks',
    title: 'Peripheral Circulation Surge',
    description: 'Microvascular circulation improves throughout the body; physical exertion feels significantly easier.',
    clinicalSource: 'American Heart Association, "Benefits of Quitting Smoking"',
  },
  {
    id: 'lung_cilia_regrowth',
    category: 'respiratory',
    targetMs: 30 * MS_PER_DAY,
    timeLabel: '1 month',
    title: 'Cilia Regrowth in Airway',
    description: 'Cilia lining the bronchial passages regenerate, resuming self-cleaning of mucus, dust, and particulate matter.',
    clinicalSource: 'American Lung Association, "What Happens When You Quit"',
  },
  {
    id: 'craving_receptor_reset',
    category: 'neurological',
    targetMs: 90 * MS_PER_DAY,
    timeLabel: '3 months',
    title: 'Nicotine Receptor Density Normalization',
    description: 'Brain alpha-4 beta-2 nicotinic acetylcholine receptor density returns toward baseline non-dependent levels.',
    clinicalSource: 'National Institute on Drug Abuse, "Neurobiology of Nicotine Dependence"',
  },
  {
    id: 'lung_capacity_peak',
    category: 'respiratory',
    targetMs: 180 * MS_PER_DAY,
    timeLabel: '6 months',
    title: 'Major Lung Function & Volume Recovery',
    description: 'Airway inflammation subsides substantially; vital lung capacity increases by up to 10-15%.',
    clinicalSource: 'CDC, "Smoking Cessation: Fast Facts"',
  },
  {
    id: 'cardiac_risk_halved',
    category: 'cardiovascular',
    targetMs: 365 * MS_PER_DAY,
    timeLabel: '1 year',
    title: 'Coronary Heart Disease Excess Risk Halved',
    description: 'Excess risk of coronary heart disease drops by approximately 50% compared to continuing nicotine use.',
    clinicalSource: 'World Health Organization (WHO), "Tobacco: Health Benefits of Smoking Cessation"',
  },
  {
    id: 'stroke_risk_baseline',
    category: 'cardiovascular',
    targetMs: 5 * 365 * MS_PER_DAY,
    timeLabel: '5 years',
    title: 'Stroke & Vascular Risk at Non-User Baseline',
    description: 'Risk of stroke and major cardiovascular events approaches that of someone who has never used nicotine.',
    clinicalSource: 'CDC, "Health Effects of Cigarette Smoking"',
  },
];

export interface HealthMilestoneStatus extends HealthMetricDef {
  /** 0..1 ratio progress toward this specific milestone */
  progress: number;
  /** 0..100 percentage with 1 decimal place */
  percentage: number;
  isCompleted: boolean;
  remainingMs: number;
}

export interface CategoryScore {
  category: HealthCategory;
  score: number; // 0..100
  milestonesCount: number;
  completedCount: number;
}

export interface OverallHealthRecovery {
  /** 0..100 composite recovery score */
  overallScore: number;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  milestones: HealthMilestoneStatus[];
  categoryScores: Record<HealthCategory, CategoryScore>;
  nextMilestone: HealthMilestoneStatus | null;
}

/** Computes clamped 0..1 progress between start (default 0) and target milliseconds. */
export function calculateHealthProgress(elapsedMs: number, targetMs: number, startMs = 0): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= startMs) return 0;
  if (!Number.isFinite(targetMs) || targetMs <= startMs) return 1;
  const span = targetMs - startMs;
  return Math.min(1, Math.max(0, (elapsedMs - startMs) / span));
}

/** Computes percentage (0..100, 1 decimal place). */
export function calculateMilestonePercentage(elapsedMs: number, targetMs: number): number {
  const p = calculateHealthProgress(elapsedMs, targetMs);
  return Math.round(p * 1000) / 10;
}

/** Evaluates all health metrics against elapsed milliseconds. */
export function getOverallHealthRecovery(elapsedMs: number): OverallHealthRecovery {
  const ms = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);

  const statuses: HealthMilestoneStatus[] = HEALTH_METRICS.map((m) => {
    const progress = calculateHealthProgress(ms, m.targetMs);
    const percentage = Math.round(progress * 1000) / 10;
    const isCompleted = ms >= m.targetMs;
    const remainingMs = Math.max(0, m.targetMs - ms);
    return {
      ...m,
      progress,
      percentage,
      isCompleted,
      remainingMs,
    };
  });

  const completedCount = statuses.filter((s) => s.isCompleted).length;
  const nextMilestone = statuses.find((s) => !s.isCompleted) ?? null;

  const categories: HealthCategory[] = ['cardiovascular', 'respiratory', 'neurological', 'sensory'];
  const categoryScores = {} as Record<HealthCategory, CategoryScore>;

  for (const cat of categories) {
    const catMilestones = statuses.filter((s) => s.category === cat);
    const sum = catMilestones.reduce((acc, curr) => acc + curr.progress, 0);
    const score = catMilestones.length > 0 ? Math.round((sum / catMilestones.length) * 1000) / 10 : 0;
    const catCompleted = catMilestones.filter((s) => s.isCompleted).length;
    categoryScores[cat] = {
      category: cat,
      score,
      milestonesCount: catMilestones.length,
      completedCount: catCompleted,
    };
  }

  const overallProgressSum = statuses.reduce((acc, curr) => acc + curr.progress, 0);
  const overallScore = Math.round((overallProgressSum / statuses.length) * 1000) / 10;

  return {
    overallScore,
    completedMilestonesCount: completedCount,
    totalMilestonesCount: statuses.length,
    milestones: statuses,
    categoryScores,
    nextMilestone,
  };
}

/**
 * Craving logging, intensity scoring (1-5 and 1-10), trigger categorization,
 * and clinically-informed coping mechanism recommendations.
 */
import { CravingEvent, CravingTrigger } from './types';

export type IntensityLevel = 'mild' | 'moderate' | 'strong' | 'severe';

export interface CopingTechnique {
  id: string;
  name: string;
  category: 'breathing' | 'physiological' | 'cognitive' | 'behavioral' | 'social';
  durationMinutes: number;
  description: string;
  steps: string[];
}

export interface CopingRecommendation {
  primaryTechnique: CopingTechnique;
  alternativeTechnique: CopingTechnique;
  contextualAdvice: string;
  urgencyLevel: IntensityLevel;
}

export const COPING_TECHNIQUES: Record<string, CopingTechnique> = {
  breathing_478: {
    id: 'breathing_478',
    name: '4-7-8 Parasympathetic Reset',
    category: 'breathing',
    durationMinutes: 3,
    description: 'Lengthens exhale relative to inhale, activating vagal nerve tone to drop heart rate and cortisol.',
    steps: [
      'Inhale quietly through your nose for 4 seconds.',
      'Hold your breath gently for 7 seconds.',
      'Exhale completely through your mouth with a soft whoosh for 8 seconds.',
      'Repeat for 4 cycles until the acute urge curve begins to decline.',
    ],
  },
  box_breathing: {
    id: 'box_breathing',
    name: '4-4-4-4 Tactical Box Breathing',
    category: 'breathing',
    durationMinutes: 2,
    description: 'Stabilizes sympathetic arousal and restores autonomic nervous system balance.',
    steps: [
      'Inhale for 4 seconds.',
      'Hold lungs full for 4 seconds.',
      'Exhale smoothly for 4 seconds.',
      'Hold lungs empty for 4 seconds.',
      'Complete 4 full rounds.',
    ],
  },
  cold_dive: {
    id: 'cold_dive',
    name: 'Mammalian Dive / Cold Water Shock',
    category: 'physiological',
    durationMinutes: 1,
    description: 'Triggers the mammalian dive reflex, immediately shifting neural focus and lowering acute heart rate.',
    steps: [
      'Splash ice-cold water onto your face and temples, or hold an ice cube in your palm.',
      'Keep your hands immersed in cold running water for 30 seconds.',
      'Notice the immediate physical temperature sensation overriding craving signals.',
    ],
  },
  grounding_54321: {
    id: 'grounding_54321',
    name: '5-4-3-2-1 Sensory Grounding',
    category: 'cognitive',
    durationMinutes: 3,
    description: 'Interrupts craving rumination by anchoring attention to direct external sensory inputs.',
    steps: [
      'Acknowledge 5 things you can see around you.',
      'Acknowledge 4 things you can physically touch right now.',
      'Acknowledge 3 distinct sounds you can hear.',
      'Acknowledge 2 distinct smells in your environment.',
      'Acknowledge 1 physical taste or take a sip of water.',
    ],
  },
  delay_ten_minutes: {
    id: 'delay_ten_minutes',
    name: '10-Minute Urge Surfing & Delay',
    category: 'behavioral',
    durationMinutes: 10,
    description: 'Cravings follow a bell-curve wave that peaks and subsides in 3-5 minutes. Agreeing to wait breaks compulsive reflex.',
    steps: [
      'Tell yourself: "I do not have to fight this; I just have to wait 10 minutes."',
      'Start a 10-minute timer on your phone.',
      'Engage in a completely different non-sedentary task (wash dishes, step outside, organize desk).',
      'When the timer dings, notice that the peak has collapsed.',
    ],
  },
  power_walk: {
    id: 'power_walk',
    name: 'Brisk 5-Minute Power Walk',
    category: 'behavioral',
    durationMinutes: 5,
    description: 'Releases natural endorphins and dopamine through light cardiovascular activity, replacing the nicotine dopaminergic dip.',
    steps: [
      'Put on shoes and step outside or walk briskly down a hallway/stairs.',
      'Pace quickly enough to elevate your breathing slightly.',
      'Notice the shift from static restless tension to kinetic energy release.',
    ],
  },
  ice_water_sip: {
    id: 'ice_water_sip',
    name: 'Ice Water Through a Straw',
    category: 'physiological',
    durationMinutes: 2,
    description: 'Simulates the oral, inhalation, and cool throat-hit sensations while hydrating your tissues.',
    steps: [
      'Fill a glass with ice water.',
      'Take slow, deep sips through a straw, pausing between sips.',
      'Feel the cold sensation traveling down your throat and chest.',
    ],
  },
  oral_substitute: {
    id: 'oral_substitute',
    name: 'Oral Habit Replacement',
    category: 'behavioral',
    durationMinutes: 2,
    description: 'Channels the mechanical hand-to-mouth conditioned reflex without chemical nicotine.',
    steps: [
      'Reach for strong cinnamon or peppermint gum, a toothpick, or a mint.',
      'Keep a fidget object or pen in your dominant hand to satisfy motor memory.',
    ],
  },
  social_boundary_plan: {
    id: 'social_boundary_plan',
    name: 'Social Shield & Exit Strategy',
    category: 'social',
    durationMinutes: 2,
    description: 'Prepares an automated defense for peer vaping environments.',
    steps: [
      'Hold a non-alcoholic beverage or sparkling water in your dominant hand so it is occupied.',
      'Use a rehearsed one-liner: "I\'m off it — feel way better."',
      'Step into the restroom or outdoors for fresh air if the craving spikes around other vapers.',
    ],
  },
  progressive_relaxation: {
    id: 'progressive_relaxation',
    name: 'Progressive Muscle Tension & Release',
    category: 'physiological',
    durationMinutes: 4,
    description: 'Discharges muscular tension that masquerades as acute nicotine craving in the evenings.',
    steps: [
      'Tightly clench your fists and shoulders for 5 seconds.',
      'Release completely on an exhale, noticing the physical contrast.',
      'Progressively tense and release your abdominal muscles, then your legs.',
      'Take three slow diaphragmatic breaths.',
    ],
  },
};

/** Normalizes any intensity score into both 1-5 and 1-10 scales. */
export function normalizeIntensity(
  raw: number,
  scaleMax: 5 | 10 = 5,
): { score1to5: number; score1to10: number } {
  if (!Number.isFinite(raw)) {
    return { score1to5: 3, score1to10: 6 };
  }
  const clamped = Math.max(1, Math.min(scaleMax, raw));
  if (scaleMax === 10) {
    const score1to10 = Math.round(clamped);
    const score1to5 = Math.max(1, Math.min(5, Math.round(score1to10 / 2)));
    return { score1to5, score1to10 };
  } else {
    const score1to5 = Math.round(clamped);
    const score1to10 = Math.max(1, Math.min(10, Math.round(score1to5 * 2)));
    return { score1to5, score1to10 };
  }
}

/** Categorizes craving intensity into clinical bands. */
export function categorizeIntensity(intensity: number, scaleMax?: 5 | 10): IntensityLevel {
  const scale = scaleMax ?? (intensity > 5 ? 10 : 5);
  const { score1to10 } = normalizeIntensity(intensity, scale);
  if (score1to10 <= 3) return 'mild';
  if (score1to10 <= 6) return 'moderate';
  if (score1to10 <= 8) return 'strong';
  return 'severe';
}

export interface CravingContext {
  isEvening?: boolean;
  isSocialSetting?: boolean;
  isAtWork?: boolean;
}

/** Recommends tailored coping interventions based on trigger, intensity, and context. */
export function recommendCopingMechanism(
  trigger: CravingTrigger,
  intensity: number,
  context?: CravingContext,
): CopingRecommendation {
  const level = categorizeIntensity(intensity);

  if (level === 'severe') {
    return {
      primaryTechnique: COPING_TECHNIQUES.cold_dive,
      alternativeTechnique: COPING_TECHNIQUES.breathing_478,
      contextualAdvice:
        'This is a severe acute spike. Shock your nervous system with cold water first, then breathe through the drop.',
      urgencyLevel: 'severe',
    };
  }

  switch (trigger) {
    case 'stress':
      if (context?.isEvening) {
        return {
          primaryTechnique: COPING_TECHNIQUES.progressive_relaxation,
          alternativeTechnique: COPING_TECHNIQUES.breathing_478,
          contextualAdvice:
            'End-of-day stress holds in your shoulders and jaw. Release the physical tension to quiet the urge.',
          urgencyLevel: level,
        };
      }
      return {
        primaryTechnique: COPING_TECHNIQUES.breathing_478,
        alternativeTechnique: COPING_TECHNIQUES.box_breathing,
        contextualAdvice:
          'Stress triggers an adrenaline spike. The 4-7-8 rhythm forces your nervous system out of fight-or-flight.',
        urgencyLevel: level,
      };

    case 'social':
    case 'drinking':
      return {
        primaryTechnique: COPING_TECHNIQUES.social_boundary_plan,
        alternativeTechnique: COPING_TECHNIQUES.ice_water_sip,
        contextualAdvice:
          'Social environments trigger conditioned hand-to-mouth cues. Keep a drink in your hand and take a 2-minute breather outside.',
        urgencyLevel: level,
      };

    case 'boredom':
      return {
        primaryTechnique: COPING_TECHNIQUES.delay_ten_minutes,
        alternativeTechnique: COPING_TECHNIQUES.power_walk,
        contextualAdvice:
          'Boredom cravings are habit loops seeking a dopamine hit. A 10-minute task or a brisk walk breaks the automatic loop.',
        urgencyLevel: level,
      };

    case 'other':
    default:
      return {
        primaryTechnique: COPING_TECHNIQUES.grounding_54321,
        alternativeTechnique: COPING_TECHNIQUES.ice_water_sip,
        contextualAdvice:
          'Acknowledge the urge without reacting. It is a passing wave that peaks in 3 minutes and then recedes.',
        urgencyLevel: level,
      };
  }
}

export interface TriggerStat {
  trigger: CravingTrigger;
  count: number;
  percentage: number;
  resistedCount: number;
  resistedRate: number;
  avgIntensity: number;
}

export interface CravingAnalysisResult {
  totalCravings: number;
  resistedTotal: number;
  overallResistanceRate: number;
  averageIntensity: number;
  peakIntensity: number;
  dominantTrigger: CravingTrigger | null;
  triggerBreakdown: Record<CravingTrigger, TriggerStat>;
  hourlyDistribution: number[]; // length 24
  peakHour: number | null;
}

/** Comprehensive analytics over the user's historical craving log. */
export function analyzeCravingTriggers(cravings: CravingEvent[]): CravingAnalysisResult {
  const validCravings = cravings.filter(
    (c) => c && typeof c.ts === 'string' && !Number.isNaN(new Date(c.ts).getTime()),
  );

  const triggers: CravingTrigger[] = ['stress', 'social', 'boredom', 'drinking', 'other'];
  const hourly = new Array(24).fill(0) as number[];

  const initialBreakdown = {} as Record<CravingTrigger, TriggerStat>;
  for (const t of triggers) {
    initialBreakdown[t] = {
      trigger: t,
      count: 0,
      percentage: 0,
      resistedCount: 0,
      resistedRate: 0,
      avgIntensity: 0,
    };
  }

  if (validCravings.length === 0) {
    return {
      totalCravings: 0,
      resistedTotal: 0,
      overallResistanceRate: 0,
      averageIntensity: 0,
      peakIntensity: 0,
      dominantTrigger: null,
      triggerBreakdown: initialBreakdown,
      hourlyDistribution: hourly,
      peakHour: null,
    };
  }

  let intensitySum = 0;
  let peakIntensity = 0;
  let resistedSum = 0;
  const triggerIntensitySum: Record<CravingTrigger, number> = {
    stress: 0,
    social: 0,
    boredom: 0,
    drinking: 0,
    other: 0,
  };

  for (const c of validCravings) {
    const intensity = Math.min(10, Math.max(1, c.intensity ?? 3));
    intensitySum += intensity;
    if (intensity > peakIntensity) peakIntensity = intensity;
    if (c.resisted) resistedSum += 1;

    const t = triggers.includes(c.trigger) ? c.trigger : 'other';
    initialBreakdown[t].count += 1;
    if (c.resisted) initialBreakdown[t].resistedCount += 1;
    triggerIntensitySum[t] += intensity;

    const hour = new Date(c.ts).getHours();
    hourly[hour] += 1;
  }

  let maxCount = -1;
  let dominantTrigger: CravingTrigger | null = null;

  for (const t of triggers) {
    const stat = initialBreakdown[t];
    stat.percentage = Math.round((stat.count / validCravings.length) * 1000) / 10;
    stat.resistedRate = stat.count > 0 ? Math.round((stat.resistedCount / stat.count) * 1000) / 10 : 0;
    stat.avgIntensity = stat.count > 0 ? Math.round((triggerIntensitySum[t] / stat.count) * 10) / 10 : 0;

    if (stat.count > maxCount && stat.count > 0) {
      maxCount = stat.count;
      dominantTrigger = t;
    }
  }

  let maxHourCount = 0;
  let peakHour: number | null = null;
  for (let h = 0; h < 24; h++) {
    if (hourly[h] > maxHourCount) {
      maxHourCount = hourly[h];
      peakHour = h;
    }
  }

  return {
    totalCravings: validCravings.length,
    resistedTotal: resistedSum,
    overallResistanceRate: Math.round((resistedSum / validCravings.length) * 1000) / 10,
    averageIntensity: Math.round((intensitySum / validCravings.length) * 10) / 10,
    peakIntensity,
    dominantTrigger,
    triggerBreakdown: initialBreakdown,
    hourlyDistribution: hourly,
    peakHour,
  };
}

/**
 * Onboarding quiz copy + option lists (BUILD_PROMPT feature 1, 11). Kept out of
 * components so screen files stay about layout/logic, not prose, and so copy can be
 * revised without touching the quiz engine.
 */

export interface QuizOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
}

export const AGE_RANGE_OPTIONS: QuizOption<'18-24' | '25-34' | '35-44' | '45+'>[] = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45+', label: '45+' },
];

export const DEVICE_TYPE_OPTIONS: QuizOption<'disposable' | 'pod' | 'mod' | 'other'>[] = [
  { value: 'disposable', label: 'Disposable', sublabel: 'e.g. Elf Bar, Geek Bar' },
  { value: 'pod', label: 'Pod system', sublabel: 'e.g. JUUL, Vuse' },
  { value: 'mod', label: 'Mod / tank', sublabel: 'Refillable, adjustable' },
  { value: 'other', label: 'Something else' },
];

export const QUIT_REASON_OPTIONS: QuizOption<'money' | 'health' | 'freedom' | 'relationship'>[] = [
  { value: 'health', label: 'My health', sublabel: 'Lungs, breathing, energy' },
  { value: 'money', label: 'My money', sublabel: 'Stop burning cash on pods' },
  { value: 'freedom', label: 'My freedom', sublabel: "Tired of needing it" },
  { value: 'relationship', label: 'My relationships', sublabel: 'Family, partner, kids' },
];

export const QUIT_METHOD_OPTIONS: QuizOption<'cold_turkey' | 'taper'>[] = [
  { value: 'cold_turkey', label: 'Cold turkey', sublabel: 'Quit completely, starting now' },
  { value: 'taper', label: 'Gradual taper', sublabel: 'Step down your allowance each week' },
];

export const DEPENDENCY_BAND_COPY: Record<'low' | 'moderate' | 'high' | 'severe', string> = {
  low: "Your dependency is lower than most — that's a real head start. Quitting now is the easiest it will ever be.",
  moderate:
    "You're moderately dependent. Your body has adapted to nicotine, but it hasn't rewired completely. This is very winnable.",
  high: "You're highly dependent — this is a real addiction, not a bad habit. That's not a judgment, it's the reason you need a real plan, not willpower alone.",
  severe:
    "Your dependency is severe. Nicotine has a strong grip on your day. The good news: the people who need the most support are the ones this app was built for.",
};

export const FIRST_PUFF_OPTIONS: QuizOption<'yes' | 'no'>[] = [
  { value: 'yes', label: 'Within 30 minutes of waking', sublabel: 'Strongest sign of dependence' },
  { value: 'no', label: 'Later in the day' },
];

/**
 * Health timeline copy (BUILD_PROMPT feature 4): science-based recovery milestones,
 * each tied to a streak-day threshold that unlocks the card. Plain-language explanation
 * up front; sources cited in an info modal, not inline (keeps the card scannable).
 *
 * Sourced from established nicotine-cessation recovery timelines (CDC, American Cancer
 * Society, American Lung Association — general smoking/nicotine cessation physiology;
 * vaping-specific longitudinal data is still emerging, so copy is worded as "similar to
 * smoking cessation" where the underlying nicotine/carbon-monoxide mechanism is shared
 * rather than vaping-specific research, per plain-language + honesty conventions).
 */

export interface HealthMilestone {
  id: string;
  /** Streak days required to unlock. */
  unlocksAtDay: number;
  /** Short unlocked-state label, e.g. "20 minutes". */
  timeLabel: string;
  title: string;
  body: string;
  sources: string[];
}

export const HEALTH_MILESTONES: HealthMilestone[] = [
  {
    id: 'heart-rate',
    unlocksAtDay: 0,
    timeLabel: '20 minutes',
    title: 'Your heart rate drops',
    body: 'Nicotine spikes your heart rate and blood pressure within seconds. About 20 minutes after your last puff, both start returning toward normal.',
    sources: [
      'American Cancer Society, "Health Benefits of Quitting Smoking Over Time"',
      'CDC, "Smoking Cessation: Fast Facts"',
    ],
  },
  {
    id: 'nicotine-drop',
    unlocksAtDay: 1,
    timeLabel: '24 hours',
    title: 'Nicotine leaves your bloodstream',
    body: "Most nicotine clears your system within a day, and carbon monoxide levels (if you'd been vaping products that produce it) return to normal. This is also when cravings and irritability tend to peak — you're past the hardest chemical part.",
    sources: ['CDC, "Smoking Cessation: Fast Facts"'],
  },
  {
    id: 'taste-smell',
    unlocksAtDay: 2,
    timeLabel: '48 hours',
    title: 'Taste and smell sharpen',
    body: 'Nicotine dulls the nerve endings responsible for taste and smell. Within about two days, damaged nerve endings begin regenerating and both senses noticeably improve.',
    sources: ['American Lung Association, "What Happens When You Quit"'],
  },
  {
    id: 'circulation',
    unlocksAtDay: 14,
    timeLabel: '2 weeks',
    title: 'Circulation improves',
    body: "Blood vessels that had tightened from repeated nicotine exposure relax. Walking and light exercise start to feel easier as circulation and lung function both improve.",
    sources: ['American Cancer Society, "Health Benefits of Quitting Smoking Over Time"'],
  },
  {
    id: 'lung-function',
    unlocksAtDay: 30,
    timeLabel: '1 month',
    title: 'Lung function increases',
    body: 'The tiny hair-like structures in your lungs (cilia) that clear mucus and debris start regrowing and regaining normal function, reducing coughing and shortness of breath.',
    sources: ['American Lung Association, "What Happens When You Quit"'],
  },
  {
    id: 'cravings-fade',
    unlocksAtDay: 90,
    timeLabel: '3 months',
    title: 'Cravings fade in intensity',
    body: 'The brain\'s nicotine-receptor density, which spiked from regular use, has mostly reset by now. Cravings become far less frequent and less intense for most people at this stage.',
    sources: ['National Institute on Drug Abuse, "Nicotine and Tobacco"'],
  },
  {
    id: 'risk-halved',
    unlocksAtDay: 365,
    timeLabel: '1 year',
    title: 'Long-term risk drops sharply',
    body: 'For smoking cessation, one year vape/smoke-free is associated with roughly half the excess risk of heart disease compared to continuing use. Vaping-specific long-term data is still emerging, but the shared nicotine/inhalation mechanism suggests a similar trend.',
    sources: ['CDC, "Smoking Cessation: Fast Facts"', 'American Heart Association, "Quitting Smoking"'],
  },
];

export const HEALTH_TIMELINE_DISCLAIMER =
  'This timeline reflects general nicotine-cessation research, most of it studied in smokers. It is educational, not a medical guarantee for your body. Individual recovery varies — talk to a doctor about your own health.';

import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOnboardingStore } from '@/store';
import { getAnalytics, AnalyticsEvent } from '@/providers';
import { AgeRangeScreen } from '@/quiz-screens/AgeRangeScreen';
import { YearsVapingScreen } from '@/quiz-screens/YearsVapingScreen';
import { DeviceTypeScreen } from '@/quiz-screens/DeviceTypeScreen';
import { PuffsPerDayScreen } from '@/quiz-screens/PuffsPerDayScreen';
import { FirstPuffScreen } from '@/quiz-screens/FirstPuffScreen';
import { FailedAttemptsScreen } from '@/quiz-screens/FailedAttemptsScreen';
import { WhyQuitScreen } from '@/quiz-screens/WhyQuitScreen';
import { WeeklySpendScreen } from '@/quiz-screens/WeeklySpendScreen';
import { DependencyScoreScreen } from '@/quiz-screens/DependencyScoreScreen';
import { SavingsChartScreen } from '@/quiz-screens/SavingsChartScreen';
import { QuitPlanScreen } from '@/quiz-screens/QuitPlanScreen';

/**
 * 11-screen onboarding quiz (screen 12 is the separate /paywall route). Each step is a
 * dedicated component under src/quiz-screens/; this file only dispatches by index,
 * wires per-screen drop-off analytics, and owns navigation.
 */
export const TOTAL_QUIZ_SCREENS = 11;

export default function QuizStep() {
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step: string }>();
  const index = Math.max(0, Math.min(TOTAL_QUIZ_SCREENS - 1, Number(step) || 0));
  const markScreen = useOnboardingStore((s) => s.markScreen);
  const answers = useOnboardingStore((s) => s.answers);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  useEffect(() => {
    markScreen(index);
    getAnalytics().capture(AnalyticsEvent.quizScreenViewed, { screen_index: index });
  }, [index, markScreen]);

  function goNext() {
    if (index >= TOTAL_QUIZ_SCREENS - 1) {
      getAnalytics().capture(AnalyticsEvent.quizCompleted);
      router.replace('/paywall');
      return;
    }
    router.push({ pathname: '/(onboarding)/quiz/[step]', params: { step: String(index + 1) } });
  }

  const progress = (index + 1) / (TOTAL_QUIZ_SCREENS + 1); // +1 leaves headroom for the paywall step

  switch (index) {
    case 0:
      return (
        <AgeRangeScreen
          progress={progress}
          value={answers.ageRange}
          onChange={(v) => setAnswer('ageRange', v)}
          onContinue={goNext}
        />
      );
    case 1:
      return (
        <YearsVapingScreen
          progress={progress}
          value={answers.yearsVaping ?? 2}
          onChange={(v) => setAnswer('yearsVaping', v)}
          onContinue={goNext}
        />
      );
    case 2:
      return (
        <DeviceTypeScreen
          progress={progress}
          value={answers.deviceType}
          onChange={(v) => setAnswer('deviceType', v)}
          onContinue={goNext}
        />
      );
    case 3:
      return (
        <PuffsPerDayScreen
          progress={progress}
          value={answers.puffsPerDay ?? 150}
          onChange={(v) => setAnswer('puffsPerDay', v)}
          onContinue={goNext}
        />
      );
    case 4:
      return (
        <FirstPuffScreen
          progress={progress}
          value={answers.firstPuffOnWaking}
          onChange={(v) => setAnswer('firstPuffOnWaking', v)}
          onContinue={goNext}
        />
      );
    case 5:
      return (
        <FailedAttemptsScreen
          progress={progress}
          value={answers.failedQuitAttempts ?? 0}
          onChange={(v) => setAnswer('failedQuitAttempts', v)}
          onContinue={goNext}
        />
      );
    case 6:
      return (
        <WhyQuitScreen
          progress={progress}
          value={answers.reasons ?? []}
          onChange={(v) => setAnswer('reasons', v)}
          onContinue={goNext}
        />
      );
    case 7:
      return (
        <WeeklySpendScreen
          progress={progress}
          value={answers.vapeCostPerWeek ?? 25}
          onChange={(v) => setAnswer('vapeCostPerWeek', v)}
          onContinue={goNext}
        />
      );
    case 8:
      return <DependencyScoreScreen progress={progress} answers={answers} onContinue={goNext} />;
    case 9:
      return (
        <SavingsChartScreen
          progress={progress}
          vapeCostPerWeek={answers.vapeCostPerWeek ?? 25}
          onContinue={goNext}
        />
      );
    case 10:
    default:
      return (
        <QuitPlanScreen
          progress={progress}
          method={answers.method}
          onChangeMethod={(v) => setAnswer('method', v)}
          puffsPerDay={answers.puffsPerDay ?? 150}
          onContinue={goNext}
        />
      );
  }
}

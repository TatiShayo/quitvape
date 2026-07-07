/** Shared chrome for a quiz question screen: progress bar, title, body, footer CTA. */
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, QuizProgress, Screen } from '@/ui';
import { spacing } from '@/theme';

interface QuizFrameProps {
  progress: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  ctaLabel?: string;
  onContinue?: () => void;
  ctaDisabled?: boolean;
  scroll?: boolean;
}

export function QuizFrame({
  progress,
  title,
  subtitle,
  children,
  ctaLabel = 'Continue',
  onContinue,
  ctaDisabled = false,
  scroll = false,
}: QuizFrameProps) {
  return (
    <Screen scroll={scroll} contentStyle={styles.screenContent}>
      <QuizProgress progress={progress} />
      <View style={styles.header}>
        <AppText variant="displayM" style={styles.title}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodyL" color="textSecondary" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
      {onContinue ? (
        <Button label={ctaLabel} onPress={onContinue} disabled={ctaDisabled} haptic style={styles.cta} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { flexGrow: 1 },
  header: { marginTop: spacing.xl, gap: spacing.sm },
  title: {},
  subtitle: {},
  body: { flex: 1, marginTop: spacing.xxl },
  cta: { marginTop: spacing.lg },
});

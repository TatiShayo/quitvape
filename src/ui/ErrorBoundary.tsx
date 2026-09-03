import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { colors, spacing } from '@/theme';
import { getErrors } from '@/providers';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    getErrors().captureException(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Card tone="care" style={styles.card}>
            <AppText variant="overline" color="accent">
              Notice
            </AppText>
            <AppText variant="title" style={styles.title}>
              {this.props.fallbackTitle ?? 'Something unexpected occurred'}
            </AppText>
            <AppText variant="body" color="textSecondary" style={styles.body}>
              {this.props.fallbackMessage ??
                'Your progress and streak are completely safe. Tap below to reload the screen.'}
            </AppText>
            <Button
              label="Try again"
              onPress={this.handleReset}
              style={styles.button}
              haptic
            />
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
  title: {
    marginTop: spacing.xs,
  },
  body: {
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.md,
  },
});

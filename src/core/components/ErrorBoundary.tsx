import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Single top-level boundary (ADR-M6); no per-screen boundaries.
class ErrorBoundaryBase extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) console.error('Uncaught render error', error, errorInfo);
  }

  private reload = (): void => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { t } = this.props;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('common:errorBoundary.title')}</Text>
        <Pressable style={styles.button} onPress={this.reload}>
          <Text style={styles.buttonText}>{t('common:errorBoundary.reload')}</Text>
        </Pressable>
      </View>
    );
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.screenTerminal,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  title: { color: colors.text.primary, ...typography.heading },
  button: {
    backgroundColor: colors.signal.positive,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  buttonText: { color: colors.background.screenTerminal, ...typography.body },
});

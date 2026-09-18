import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMarketStore } from '../../../core/data/repositories/MarketRepository';
import { colors, radius, spacing, typography } from '../../../core/theme';
import { CircularGauge } from './CircularGauge';
import { useJsFps } from './useJsFps';

const MAX_FPS = 60;

// Matches Figma's "Card Two: Live Performance Telemetry Dashboard". JS Thread FPS and WS
// Message Ingestion Rate are real, live values (ADR-M10 - cheap to measure, no reason to
// fake them); Memory Footprint has no cheap RN API for real process memory, so it's a
// static, clearly-labeled placeholder value, same treatment as the three micro-cards.
export function PerformanceDashboardCard() {
  const { t } = useTranslation();
  const fps = useJsFps();
  const messageRate = useMarketStore((state) => state.wsMessageRate);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>{t('telemetry.systemTelemetry')}</Text>
          <Text style={styles.heading}>{t('telemetry.performanceDashboard')}</Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable style={styles.resetButton}>
            <Text style={styles.resetText}>{t('telemetry.reset')}</Text>
          </Pressable>
          <View style={styles.healthyBadge}>
            <Text style={styles.healthyText}>{t('telemetry.healthy')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.gaugeSection}>
        <CircularGauge value={fps} max={MAX_FPS} unit={t('telemetry.fps')} />
        <Text style={styles.metricLabel}>{t('telemetry.jsThreadFrameRate')}</Text>
      </View>

      <View style={styles.counterSection}>
        <Text style={styles.counterValue}>{messageRate}</Text>
        <Text style={styles.counterUnit}>{t('telemetry.msgsPerSec')}</Text>
        <Text style={styles.metricLabel}>{t('telemetry.wsIngestionRate')}</Text>
      </View>

      <View style={styles.memorySection}>
        <View style={styles.memoryHeader}>
          <Text style={styles.metricLabel}>{t('telemetry.memoryFootprint')}</Text>
          <Text style={styles.memoryValue}>142.4 MB</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background.card, borderRadius: radius.card, padding: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: colors.signal.negativeMuted, ...typography.labelCaps },
  heading: { color: colors.text.primary, ...typography.heading, marginTop: spacing.xs },
  headerButtons: { flexDirection: 'row', gap: spacing.sm },
  resetButton: {
    backgroundColor: colors.background.divider,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  resetText: { color: colors.text.primary, ...typography.labelCaps },
  healthyBadge: {
    backgroundColor: 'rgba(63,224,146,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(63,224,146,0.2)',
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  healthyText: { color: colors.signal.positive, ...typography.labelCaps },
  gaugeSection: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.navBar,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  counterSection: {
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.navBar,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  counterValue: { color: colors.text.primary, ...typography.priceDisplay },
  counterUnit: { color: colors.text.numeric, ...typography.labelCaps },
  metricLabel: { color: colors.text.primary, ...typography.body },
  memorySection: {
    backgroundColor: colors.background.navBar,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  memoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memoryValue: { color: colors.text.numeric, ...typography.tableValue },
});

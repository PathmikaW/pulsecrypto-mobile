import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../core/components/Icon';
import { useMarketStore } from '../../../core/data/repositories/MarketRepository';
import { colors, radius, spacing, typography } from '../../../core/theme';
import { CircularGauge } from './CircularGauge';
import { MemorySparkline } from './MemorySparkline';
import { useJsFps } from './useJsFps';

const MAX_FPS = 60;

// JS FPS and WS ingestion rate are live; Memory Footprint is a static placeholder because RN has no cheap process-memory API (ADR-M10).
export function PerformanceDashboardCard() {
  const { t } = useTranslation();
  const fps = useJsFps();
  const messageRate = useMarketStore((state) => state.wsMessageRate);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{t('telemetry.systemTelemetry')}</Text>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{t('telemetry.performanceDashboard')}</Text>
        <View style={styles.headerButtons}>
          {/* Invisible one-line heading: gives this row the heading's exact first-line height (font scale included) so the buttons centre on "Performance". */}
          <Text style={styles.lineSpacer} importantForAccessibility="no" accessibilityElementsHidden>
            {'\u200B'}
          </Text>
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
        <Icon name="wsIngestion" size={30} color={colors.signal.negativeMuted} />
        <Text style={styles.counterValue}>{messageRate}</Text>
        <Text style={styles.counterUnit}>{t('telemetry.msgsPerSec')}</Text>
        <Text style={styles.metricLabel}>{t('telemetry.wsIngestionRate')}</Text>
      </View>

      <View style={styles.memorySection}>
        <View style={styles.memoryHeader}>
          <Text style={styles.metricLabel}>{t('telemetry.memoryFootprint')}</Text>
          <Text style={styles.memoryValue}>142.4 MB</Text>
        </View>
        <MemorySparkline />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: `${colors.background.card}66`, borderRadius: radius.card, padding: spacing.lg },
  eyebrow: { color: colors.signal.negativeMuted, ...typography.labelCaps },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  // flexShrink: 1 lets the heading wrap instead of crowding the RESET/HEALTHY buttons.
  heading: { flexShrink: 1, color: colors.text.primary, ...typography.heading },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lineSpacer: { ...typography.heading, width: 0, marginRight: -spacing.sm, opacity: 0 },
  resetButton: {
    backgroundColor: colors.background.divider,
    borderRadius: radius.button,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  resetText: { color: colors.text.primary, ...typography.labelCaps },
  healthyBadge: {
    backgroundColor: 'rgba(63,224,146,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(63,224,146,0.2)',
    borderRadius: radius.button,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
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
  counterValue: { color: colors.text.primary, ...typography.priceDisplay, marginTop: spacing.sm },
  // Overrides labelCaps' uppercase: the unit reads "msgs/sec".
  counterUnit: { color: colors.text.numeric, ...typography.labelCaps, textTransform: 'none' },
  metricLabel: { color: colors.text.primary, ...typography.body },
  memorySection: {
    backgroundColor: colors.background.navBar,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  memoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memoryValue: { color: colors.signal.negativeMuted, ...typography.tableValue },
});

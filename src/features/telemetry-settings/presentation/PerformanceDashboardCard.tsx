import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../core/components/Icon';
import { useMarketStore } from '../../../core/data/repositories/MarketRepository';
import { colors, radius, spacing, typography } from '../../../core/theme';
import { CircularGauge } from './CircularGauge';
import { MemorySparkline } from './MemorySparkline';
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
        <View style={styles.headingBlock}>
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
  // Verified value: #1E2633 at 0x66 alpha (~40% opacity), not the fully solid card color -
  // same treatment as MicroCard's card background.
  card: { backgroundColor: `${colors.background.card}66`, borderRadius: radius.card, padding: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  // flexShrink: 1 - without it, this block sizes to "Performance Dashboard"'s full
  // single-line width and crowds the RESET/HEALTHY buttons instead of wrapping the
  // heading onto two lines the way Figma shows it.
  headingBlock: { flexShrink: 1 },
  eyebrow: { color: colors.signal.negativeMuted, ...typography.labelCaps },
  heading: { color: colors.text.primary, ...typography.heading, marginTop: spacing.xs },
  // marginTop pushes the buttons down to align with "Performance" (the heading's first
  // line), not the eyebrow above it - eyebrow's own rendered height (labelCaps, 11px) plus
  // heading's marginTop (spacing.xs).
  headerButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: 11 + spacing.xs },
  // radius.button (very low), not radius.card - Figma's RESET/HEALTHY badges are close to
  // square corners, not the more rounded pill or card radius tried earlier.
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
  // marginTop adds extra gap specifically between the icon and this digit, on top of
  // counterSection's own base gap (which also applies to the unit/label below it).
  counterValue: { color: colors.text.primary, ...typography.priceDisplay, marginTop: spacing.sm },
  // textTransform: 'none' overrides labelCaps' default uppercase - Figma shows this one
  // lowercase ("msgs/sec"), unlike every other labelCaps usage on this screen.
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

import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { TopAppBar } from '../../../core/components/TopAppBar';
import { useMarketStore } from '../../../core/data/repositories/MarketRepository';
import { colors, spacing, typography } from '../../../core/theme';
import { formatPairDisplayName } from '../../../core/utils/formatPairDisplayName';
import { useUiStore } from '../../../store/uiStore';
import { DataThrottlingCard } from './DataThrottlingCard';
import { MicroCard } from './MicroCard';
import { PerformanceDashboardCard } from './PerformanceDashboardCard';

// Both the Telemetry and Settings tabs route here (ADR-M10).
export function TelemetryScreen() {
  const { t } = useTranslation();
  // Shows the same pair as Terminal, falling back to live/cached data if Terminal hasn't been visited.
  const selectedPair = useUiStore((state) => state.selectedPair);
  const liveTrackedPairs = useMarketStore(useShallow((state) => Object.keys(state.pairs)));
  const pair = selectedPair ?? liveTrackedPairs[0];

  return (
    <View style={styles.container}>
      <TopAppBar title={pair ? formatPairDisplayName(undefined, pair) : t('nav.telemetry')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>{t('telemetry.title')}</Text>
        <Text style={styles.subtitle}>{t('telemetry.subtitle')}</Text>

        <View style={styles.grid}>
          <DataThrottlingCard />
          <PerformanceDashboardCard />
          <MicroCard
            icon="gpuAcceleration"
            tint={colors.signal.positive}
            label={t('telemetry.gpuAcceleration')}
            value={t('telemetry.gpuAccelerationValue')}
          />
          <MicroCard
            icon="apiLatency"
            tint={colors.signal.negativeMuted}
            label={t('telemetry.apiLatency')}
            value={t('telemetry.apiLatencyValue')}
          />
          <MicroCard
            icon="storageCache"
            tint={colors.text.numeric}
            label={t('telemetry.storageCache')}
            value={t('telemetry.storageCacheValue')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.screenTelemetry },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xl },
  heading: { color: colors.text.primary, ...typography.headingLarge },
  subtitle: { color: colors.text.numeric, ...typography.body, marginTop: -spacing.md },
  grid: { gap: spacing.xl },
});

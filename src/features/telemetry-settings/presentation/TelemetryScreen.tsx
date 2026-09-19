import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { BottomNavBar } from '../../../core/components/BottomNavBar';
import { TopAppBar } from '../../../core/components/TopAppBar';
import { useMarketStore } from '../../../core/data/repositories/MarketRepository';
import { colors, spacing, typography } from '../../../core/theme';
import { formatPairDisplayName } from '../../../core/utils/formatPairDisplayName';
import { useUiStore } from '../../../store/uiStore';
import { DataThrottlingCard } from './DataThrottlingCard';
import { MicroCard } from './MicroCard';
import { PerformanceDashboardCard } from './PerformanceDashboardCard';

// Built to Figma's "Telemetry & Settings" frame (node 1:314) at full fidelity - not an
// assignment requirement, built because Figma specifies it in full (ADR-M10). Both the
// "Telemetry" and "Settings" bottom nav tabs route here, matching Figma's single combined
// destination for both.
export function TelemetryScreen() {
  const { t } = useTranslation();
  // TopAppBar shows the selected trading pair here too, same as Terminal - confirmed
  // against Figma directly, not the "leftover" it first looked like (see
  // specs/mobile-screens.md). Falls back to whatever's live/cached if Terminal hasn't been
  // visited yet this session, same chain Terminal itself uses.
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
            icon="flash-outline"
            boxColor={colors.signal.positive}
            glyphColor={colors.signal.positiveMuted}
            label={t('telemetry.gpuAcceleration')}
            value={t('telemetry.gpuAccelerationValue')}
          />
          <MicroCard
            icon="shield-outline"
            boxColor={colors.signal.negativeMuted}
            glyphColor={colors.signal.negative}
            label={t('telemetry.apiLatency')}
            value={t('telemetry.apiLatencyValue')}
          />
          <MicroCard
            icon="server-outline"
            boxColor={colors.text.numeric}
            glyphColor={colors.background.screenTelemetry}
            label={t('telemetry.storageCache')}
            value={t('telemetry.storageCacheValue')}
          />
        </View>
      </ScrollView>

      <BottomNavBar />
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

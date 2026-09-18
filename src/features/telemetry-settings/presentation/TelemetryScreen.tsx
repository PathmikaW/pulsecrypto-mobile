import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavBar } from '../../../core/components/BottomNavBar';
import { ConnectionIndicator } from '../../../core/components/ConnectionIndicator';
import { colors, spacing, typography } from '../../../core/theme';
import { DataThrottlingCard } from './DataThrottlingCard';
import { MicroCard } from './MicroCard';
import { PerformanceDashboardCard } from './PerformanceDashboardCard';

// Built to Figma's "Telemetry & Settings" frame (node 1:314) at full fidelity - not an
// assignment requirement, built because Figma specifies it in full (ADR-M10). Both the
// "Telemetry" and "Settings" bottom nav tabs route here, matching Figma's single combined
// destination for both.
export function TelemetryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.topAppBar, { paddingTop: insets.top + spacing.md }]}>
        {/* The TopAppBar row shows "BTC/USDT" + "LIVE" in the Figma source, reading as a
        leftover from a shared header component - kept structurally but with a
        screen-appropriate title and the real, shared ConnectionIndicator instead of a
        static "LIVE" badge (specs/mobile-screens.md). */}
        <Text style={styles.topAppBarTitle}>{t('nav.telemetry')}</Text>
        <ConnectionIndicator />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>{t('telemetry.title')}</Text>
        <Text style={styles.subtitle}>{t('telemetry.subtitle')}</Text>

        <View style={styles.grid}>
          <DataThrottlingCard />
          <PerformanceDashboardCard />
          <MicroCard
            icon="hardware-chip-outline"
            iconColor={colors.signal.positive}
            label={t('telemetry.gpuAcceleration')}
            value={t('telemetry.gpuAccelerationValue')}
          />
          <MicroCard
            icon="pulse-outline"
            iconColor={colors.signal.negativeMuted}
            label={t('telemetry.apiLatency')}
            value={t('telemetry.apiLatencyValue')}
          />
          <MicroCard
            icon="server-outline"
            iconColor={colors.text.numeric}
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
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.background.recessed,
  },
  topAppBarTitle: { color: colors.text.primary, ...typography.heading },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xl },
  heading: { color: colors.text.primary, ...typography.headingLarge },
  subtitle: { color: colors.text.numeric, ...typography.body, marginTop: -spacing.md },
  grid: { gap: spacing.xl },
});

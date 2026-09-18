import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { BottomNavBar } from '../../../core/components/BottomNavBar';
import { colors, typography } from '../../../core/theme';

// The bento-grid dashboard (throttling configurator, live performance telemetry, stat
// cards) lands in Phase 4, built to Figma's "Telemetry & Settings" frame at full fidelity
// — not an assignment requirement (ADR-M10). Both the "Telemetry" and "Settings" bottom
// nav tabs route here, matching Figma's single combined destination for both.
export function TelemetryScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('telemetry.title')}</Text>
      </View>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.screenTelemetry },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text.primary, ...typography.heading },
});

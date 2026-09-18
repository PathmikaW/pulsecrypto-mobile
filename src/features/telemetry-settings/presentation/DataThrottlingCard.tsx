import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../core/theme';

const MIN_FREQUENCY_MS = 10;
const MAX_FREQUENCY_MS = 1000;
const DEFAULT_FREQUENCY_MS = 250;

// Matches Figma's "Card One: Data Throttling Configurator" exactly, including default
// toggle states verified from the file (Binary Protocol Compression on, Adaptive Polling
// Strategy off). Local UI state only - no backend control exists for any of this
// (ADR-M10) - the app doesn't actually throttle its own WS handling based on these.
export function DataThrottlingCard() {
  const { t } = useTranslation();
  const [frequencyMs, setFrequencyMs] = useState(DEFAULT_FREQUENCY_MS);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [adaptivePolling, setAdaptivePolling] = useState(false);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{t('telemetry.networkControl')}</Text>
      <Text style={styles.heading}>{t('telemetry.dataThrottling')}</Text>

      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.label}>{t('telemetry.updateFrequency')}</Text>
          <Text style={styles.value}>{`${frequencyMs}ms`}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={MIN_FREQUENCY_MS}
          maximumValue={MAX_FREQUENCY_MS}
          step={10}
          value={frequencyMs}
          onValueChange={setFrequencyMs}
          minimumTrackTintColor={colors.signal.positive}
          maximumTrackTintColor={colors.background.divider}
          thumbTintColor={colors.signal.positive}
        />
        <View style={styles.sliderBounds}>
          <Text style={styles.boundLabel}>{`${MIN_FREQUENCY_MS}ms`}</Text>
          <Text style={styles.boundLabel}>{`${MAX_FREQUENCY_MS}ms`}</Text>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{t('telemetry.binaryProtocolCompression')}</Text>
        <Switch
          value={compressionEnabled}
          onValueChange={setCompressionEnabled}
          trackColor={{ false: colors.background.divider, true: colors.signal.positive }}
          thumbColor="#FFFFFF"
        />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{t('telemetry.adaptivePollingStrategy')}</Text>
        <Switch
          value={adaptivePolling}
          onValueChange={setAdaptivePolling}
          trackColor={{ false: colors.background.divider, true: colors.signal.positive }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background.card, borderRadius: radius.card, padding: spacing.lg },
  eyebrow: { color: colors.signal.positive, ...typography.labelCaps },
  heading: { color: colors.text.primary, ...typography.heading, marginTop: spacing.xs },
  sliderSection: { marginTop: spacing.lg },
  slider: { width: '100%', height: 32 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.text.label, ...typography.bodySmall },
  value: { color: colors.signal.positive, ...typography.tableValueLarge },
  sliderBounds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.xs },
  boundLabel: { color: colors.text.label, ...typography.tableValueSmall },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.background.divider,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  toggleLabel: { color: colors.text.primary, ...typography.body, flex: 1 },
});

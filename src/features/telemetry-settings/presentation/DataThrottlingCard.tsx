import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../core/components/Icon';
import { Slider } from './Slider';
import { Toggle } from './Toggle';
import { colors, radius, spacing, typography } from '../../../core/theme';

const MIN_FREQUENCY_MS = 10;
const MID_FREQUENCY_MS = 500;
const MAX_FREQUENCY_MS = 1000;
const DEFAULT_FREQUENCY_MS = 250;

// Local UI state only; no backend control exists, so these toggles don't throttle anything (ADR-M10).
export function DataThrottlingCard() {
  const { t } = useTranslation();
  const [frequencyMs, setFrequencyMs] = useState(DEFAULT_FREQUENCY_MS);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [adaptivePolling, setAdaptivePolling] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>{t('telemetry.networkControl')}</Text>
          <Text style={styles.heading}>{t('telemetry.dataThrottling')}</Text>
        </View>
        <Icon name="dataThrottlingGauge" size={26} color={colors.text.numeric} />
      </View>

      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.label}>{t('telemetry.updateFrequency')}</Text>
          <Text style={styles.value}>{`${frequencyMs}ms`}</Text>
        </View>
        <Slider
          minimumValue={MIN_FREQUENCY_MS}
          maximumValue={MAX_FREQUENCY_MS}
          step={10}
          value={frequencyMs}
          onValueChange={setFrequencyMs}
          accessibilityLabel={t('telemetry.updateFrequency')}
        />
        <View style={styles.sliderBounds}>
          <Text style={styles.boundLabel}>{`${MIN_FREQUENCY_MS}ms`}</Text>
          <Text style={styles.boundLabel}>{`${MID_FREQUENCY_MS}ms`}</Text>
          <Text style={styles.boundLabel}>{`${MAX_FREQUENCY_MS}ms`}</Text>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{t('telemetry.binaryProtocolCompression')}</Text>
        <Toggle
          value={compressionEnabled}
          onValueChange={setCompressionEnabled}
          accessibilityLabel={t('telemetry.binaryProtocolCompression')}
        />
      </View>
      <View style={[styles.toggleRow, styles.toggleRowNoDivider]}>
        <Text style={styles.toggleLabel}>{t('telemetry.adaptivePollingStrategy')}</Text>
        <Toggle
          value={adaptivePolling}
          onValueChange={setAdaptivePolling}
          accessibilityLabel={t('telemetry.adaptivePollingStrategy')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: `${colors.background.card}66`, borderRadius: radius.card, padding: spacing.xl },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: colors.signal.positive, ...typography.labelCaps },
  heading: { color: colors.text.primary, ...typography.heading, marginTop: spacing.xs },
  sliderSection: { marginTop: spacing.xxl },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  label: { color: colors.text.numeric, ...typography.bodySmall },
  value: { color: colors.signal.positive, ...typography.tableValueLarge },
  sliderBounds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  boundLabel: { color: colors.text.numeric, ...typography.tableValueSmall },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.background.divider,
    paddingTop: spacing.xl,
    marginTop: spacing.xl,
  },
  toggleRowNoDivider: { borderTopWidth: 0, paddingTop: 0, marginTop: spacing.md },
  toggleLabel: { color: colors.text.primary, ...typography.body, flex: 1 },
});

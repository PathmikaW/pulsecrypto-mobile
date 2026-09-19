import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../core/components/Icon';
import { Slider } from '../../../core/components/Slider';
import { Toggle } from '../../../core/components/Toggle';
import { colors, radius, spacing, typography } from '../../../core/theme';

const MIN_FREQUENCY_MS = 10;
const MID_FREQUENCY_MS = 500;
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
      {/* No borderTop between the two toggle rows - Figma only shows the one separating
      the toggle group from the slider section above, not one between the toggles
      themselves. */}
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
  // Verified value: #1E2633 at 0x66 alpha (~40% opacity), not the fully solid card color -
  // same treatment as MicroCard's card background.
  card: { backgroundColor: `${colors.background.card}66`, borderRadius: radius.card, padding: spacing.xl },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: colors.signal.positive, ...typography.labelCaps },
  heading: { color: colors.text.primary, ...typography.heading, marginTop: spacing.xs },
  sliderSection: { marginTop: spacing.xxl },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  // text.numeric (#C6C6CB) - verified value, not text.label as tried earlier.
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
  // Smaller paddingTop/marginTop than toggleRow's - without a divider line to separate
  // them, the two rows only need normal item spacing, not the larger gap that used to
  // give the border line room to breathe.
  toggleRowNoDivider: { borderTopWidth: 0, paddingTop: 0, marginTop: spacing.md },
  toggleLabel: { color: colors.text.primary, ...typography.body, flex: 1 },
});

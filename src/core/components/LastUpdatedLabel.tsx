import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { colors, typography } from '../theme';

interface LastUpdatedLabelProps {
  lastUpdatedAt: number; // ms epoch, passed through unmodified from MarketData (ADR-B4/§12.2)
}

// Renders the conflation tick's own wall-clock time via Intl.DateTimeFormat — never a
// hand-rolled date string, never recomputed client-side (ADR-M9, ADR-B4).
export function LastUpdatedLabel({ lastUpdatedAt }: LastUpdatedLabelProps) {
  const { t, i18n } = useTranslation('market-details');
  const time = new Intl.DateTimeFormat(i18n.language, { timeStyle: 'medium' }).format(
    new Date(lastUpdatedAt)
  );

  return (
    <Text style={{ color: colors.text.label, ...typography.bodySmall }}>{t('lastUpdated', { time })}</Text>
  );
}

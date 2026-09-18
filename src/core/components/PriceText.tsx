import { useTranslation } from 'react-i18next';
import { Text, type TextStyle } from 'react-native';
import { colors, typography } from '../theme';
import { formatPrice } from '../utils/formatPrice';

interface PriceTextProps {
  value: number;
  style?: TextStyle;
}

// Renders a formatted price via Intl (ADR-M9), styled with the numeric mono type scale
// (ADR-M10). The green/red flash-on-change treatment (ADR-M4, react-native-reanimated) is
// layered on top of this component in Phase 4 — this covers correct, locale-aware display.
export function PriceText({ value, style }: PriceTextProps) {
  const { i18n } = useTranslation();
  return (
    <Text style={[{ color: colors.text.primary, ...typography.priceDisplay }, style]}>
      {formatPrice(value, i18n.language)}
    </Text>
  );
}

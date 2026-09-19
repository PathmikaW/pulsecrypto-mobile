import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput } from 'react-native';
import { colors, radius, spacing, typography } from '../../../core/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { t } = useTranslation('watchlist');
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={t('searchPlaceholder')}
      placeholderTextColor={colors.text.label}
      autoCapitalize="none"
      autoCorrect={false}
      accessibilityLabel={t('searchPlaceholder')}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.background.recessed,
    borderRadius: radius.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    // marginTop: gap between the TopAppBar and the search field - was flush against it.
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text.primary,
    ...typography.body,
  },
});

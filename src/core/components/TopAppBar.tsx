import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../../store/uiStore';
import { colors, spacing, typography } from '../theme';
import { ConnectionIndicator } from './ConnectionIndicator';
import { Icon } from './Icon';

interface TopAppBarProps {
  title: string;
}

// Shared header; the AccountDrawer is one global overlay mounted at the app root.
export function TopAppBar({ title }: TopAppBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const openDrawer = useUiStore((state) => state.openDrawer);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Pressable onPress={openDrawer} hitSlop={12} accessibilityLabel={t('common:menu')}>
        <Icon name="menu" size={22} color={colors.signal.positive} />
      </Pressable>
      <View style={styles.titleGroup}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <ConnectionIndicator />
      </View>
      <View style={styles.spacer} />
      <Icon name="livePulse" size={18} color={colors.signal.positive} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  title: { color: colors.text.primary, ...typography.heading },
  spacer: { flex: 1 },
});

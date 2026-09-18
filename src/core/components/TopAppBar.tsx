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

// Shared header used by every screen (Figma's TopAppBar structure appears on Terminal and
// Telemetry alike, with the same hamburger-opens-drawer pattern) - the drawer itself is a
// single global overlay (see AccountDrawer, mounted once at the app root), not duplicated
// per screen, so any screen's hamburger button opens the same instance.
export function TopAppBar({ title }: TopAppBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const openDrawer = useUiStore((state) => state.openDrawer);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable onPress={openDrawer} hitSlop={12} accessibilityLabel={t('common:menu')}>
        <Icon name="menu" size={22} color={colors.signal.positive} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>
        <ConnectionIndicator />
        <Icon name="livePulse" size={18} color={colors.signal.positive} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: { flex: 1, color: colors.text.primary, ...typography.heading, textAlign: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

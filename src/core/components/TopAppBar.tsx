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
      {/* Title + connection status are one adjacent block (matches Figma - the status sits
      right next to the pair name, not independently centered), with the remaining space
      pushing the pulse icon to the far right instead of splitting evenly around a centered
      title. */}
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
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  title: { color: colors.text.primary, ...typography.heading },
  spacer: { flex: 1 },
});

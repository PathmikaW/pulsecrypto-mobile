import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/types';
import type { SvgIconName } from '../icons/svgIcons';
import { colors, radius, spacing, typography } from '../theme';
import { Icon } from './Icon';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type TabRoute = keyof RootStackParamList;

const TABS: readonly { route: TabRoute; labelKey: string; icon: SvgIconName }[] = [
  { route: 'Terminal', labelKey: 'nav.terminal', icon: 'navTerminal' },
  { route: 'Markets', labelKey: 'nav.markets', icon: 'navMarkets' },
  { route: 'Telemetry', labelKey: 'nav.telemetry', icon: 'navTelemetry' },
  { route: 'Settings', labelKey: 'nav.settings', icon: 'navSettings' },
];

// Four tabs, present on every screen (specs/mobile-screens.md) - Telemetry and Settings
// both route to the same TelemetryScreen (ADR-M10). Active-tab color (green) verified
// directly against the Figma file's own Terminal-tab-active state, not guessed.
export function BottomNavBar() {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const activeRoute = useNavigationState((state) => state.routes[state.index]?.name);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {TABS.map(({ route, labelKey, icon }) => {
        const isActive = activeRoute === route;
        const tintColor = isActive ? colors.signal.positive : colors.text.numeric;
        return (
          <Pressable
            key={route}
            style={styles.tab}
            onPress={() => navigation.navigate(route)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {/* Active tab gets a pill background behind icon+label, not just a color
            change - matches Figma's active tab state. */}
            <View style={[styles.tabContent, isActive && styles.tabContentActive]}>
              <Icon name={icon} size={20} color={tintColor} />
              <Text style={[styles.label, isActive && styles.labelActive]}>{t(labelKey)}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.navBar,
    borderTopWidth: 1,
    borderTopColor: colors.background.divider,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  tabContent: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  tabContentActive: { backgroundColor: colors.signal.positiveMuted },
  label: { color: colors.text.label, ...typography.labelCaps },
  labelActive: { color: colors.signal.positive },
});

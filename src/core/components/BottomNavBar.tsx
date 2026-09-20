import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/types';
import type { SvgIconName } from '../icons/svgIcons';
import { colors, radius, spacing, typography } from '../theme';
import { Icon } from './Icon';

type Navigation = BottomTabNavigationProp<RootStackParamList>;
type TabRoute = keyof RootStackParamList;

// Fixed height so every tab's active pill is pixel-identical regardless of per-label text measurement.
const TAB_HEIGHT = 52;

const TABS: readonly { route: TabRoute; labelKey: string; icon: SvgIconName }[] = [
  { route: 'Terminal', labelKey: 'nav.terminal', icon: 'navTerminal' },
  { route: 'Markets', labelKey: 'nav.markets', icon: 'navMarkets' },
  { route: 'Telemetry', labelKey: 'nav.telemetry', icon: 'navTelemetry' },
  { route: 'Settings', labelKey: 'nav.settings', icon: 'navSettings' },
];

// Telemetry and Settings both route to TelemetryScreen (ADR-M10).
export function BottomNavBar() {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const activeRoute = useNavigationState((state) => state.routes[state.index]?.name);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.xs }]}>
      {TABS.map(({ route, labelKey, icon }) => {
        const isActive = activeRoute === route;
        return (
          <View key={route} style={styles.tab}>
            {/* No android_ripple - Android's native ripple mask can paint square for a
            frame before catching up to a Pressable's own borderRadius, regardless of
            overflow:'hidden' (a known platform timing quirk, not a style mistake). Driven
            by Pressable's own `pressed` state instead - same fix already used for
            AccountDrawer's DrawerLink for the identical class of problem. */}
            <Pressable
              style={({ pressed }) => [styles.tabContent, (isActive || pressed) && styles.tabContentActive]}
              onPress={() => navigation.navigate(route)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              {({ pressed }) => {
                const tintColor = isActive || pressed ? colors.signal.positive : colors.text.numeric;
                return (
                  <>
                    <Icon name={icon} size={20} color={tintColor} />
                    <Text
                      style={[styles.label, (isActive || pressed) && styles.labelActive]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {t(labelKey)}
                    </Text>
                  </>
                );
              }}
            </Pressable>
          </View>
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
    paddingTop: spacing.xs,
  },
  // Stretch + horizontal padding here gives every tab's pill equal width regardless of label length.
  tab: {
    flex: 1,
    height: TAB_HEIGHT,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: spacing.sm,
  },
  tabContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  tabContentActive: { backgroundColor: `${colors.signal.positive}26` },
  // Overrides labelCaps' uppercase: nav labels are title case.
  label: { color: colors.text.numeric, ...typography.labelCaps, textTransform: 'none' },
  labelActive: { color: colors.signal.positive },
});

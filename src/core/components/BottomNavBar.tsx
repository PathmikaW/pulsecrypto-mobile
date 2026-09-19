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
        const tintColor = isActive ? colors.signal.positive : colors.text.primary;
        return (
          <View key={route} style={styles.tab}>
            {/* The Pressable IS the rounded pill (not a plain rectangular Pressable
            wrapping a separately-rounded inner View) - Android's ripple clips to
            whichever node hosts it, so putting the radius on a different element than
            the Pressable showed a square ripple flash before the rounded pill appeared.
            android_ripple is themed green instead of the OS default gray. */}
            <Pressable
              style={[styles.tabContent, isActive && styles.tabContentActive]}
              onPress={() => navigation.navigate(route)}
              android_ripple={{ color: `${colors.signal.positive}40`, borderless: false }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Icon name={icon} size={20} color={tintColor} />
              <Text style={[styles.label, isActive && styles.labelActive]}>{t(labelKey)}</Text>
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
    gap: spacing.xs,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  tabContent: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  // A translucent tint of colors.signal.positive (same box/glyph relationship as the
  // Telemetry micro-cards), not the near-black positiveMuted solid - that read as barely
  // visible against the nav bar's own dark background. Wider horizontal padding (lg, not
  // md) so the pill reads as a fuller shape around the icon+label, matching Figma.
  tabContentActive: { backgroundColor: `${colors.signal.positive}26` },
  // textTransform: 'none' overrides labelCaps' default uppercase - Figma's nav labels
  // ("Terminal", "Markets"...) are title case, not all-caps, unlike most other labelCaps
  // usages in this app. color: text.primary (white), not text.label (dim gray) - was also
  // inconsistent with the inactive icon's own tintColor, which already used a lighter gray.
  label: { color: colors.text.primary, ...typography.labelCaps, textTransform: 'none' },
  labelActive: { color: colors.signal.positive },
});

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
                // text.numeric (#C6C6CB) - verified value, not text.primary/white as tried earlier.
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
  },
  // alignItems: 'stretch' (not 'center') + paddingHorizontal here, not on tabContent, is
  // what gives every tab's pill an equal width regardless of its own label's text length -
  // tabContent stretches to fill whatever's left of this tab's fixed 1/4 share (inset by
  // this padding on both sides), so "Markets" (a shorter word) no longer gets a visibly
  // narrower highlighted area than "Telemetry". No paddingVertical here (only on
  // tabContent below) - an outer vertical pad here would sit outside tabContent's painted
  // background, so the active pill would look shorter than the full tab slot other icons
  // occupy.
  tab: { flex: 1, alignItems: 'stretch', paddingHorizontal: spacing.sm },
  tabContent: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
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
  // usages in this app. color: text.numeric (#C6C6CB) - verified value, matching tintColor.
  label: { color: colors.text.numeric, ...typography.labelCaps, textTransform: 'none' },
  labelActive: { color: colors.signal.positive },
});

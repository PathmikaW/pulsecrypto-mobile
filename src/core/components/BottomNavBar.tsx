import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type TabRoute = keyof RootStackParamList;

const TABS: readonly { route: TabRoute; labelKey: string }[] = [
  { route: 'Terminal', labelKey: 'nav.terminal' },
  { route: 'Markets', labelKey: 'nav.markets' },
  { route: 'Telemetry', labelKey: 'nav.telemetry' },
  { route: 'Settings', labelKey: 'nav.settings' },
];

// Four tabs, present on every screen (specs/mobile-screens.md) - Telemetry and Settings
// both route to the same TelemetryScreen (ADR-M10). Styled with design-tokens.md's real
// colors; the Figma-exact active-tab treatment (not confirmed in the API pull) is a visual
// refinement to spot-check against the Figma node directly, not a functional gap.
export function BottomNavBar() {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const activeRoute = useNavigationState((state) => state.routes[state.index]?.name);

  return (
    <View style={styles.container}>
      {TABS.map(({ route, labelKey }) => {
        const isActive = activeRoute === route;
        return (
          <Pressable
            key={route}
            style={styles.tab}
            onPress={() => navigation.navigate(route)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{t(labelKey)}</Text>
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
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  label: { color: colors.text.label, ...typography.labelCaps },
  labelActive: { color: colors.text.primary },
});

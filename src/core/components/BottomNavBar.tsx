import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
// both route to the same TelemetryScreen (ADR-M10). Active-tab color (green) verified
// directly against the Figma file's own Terminal-tab-active state, not guessed.
export function BottomNavBar() {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const activeRoute = useNavigationState((state) => state.routes[state.index]?.name);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
  labelActive: { color: colors.signal.positive },
});

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomNavBar } from '../core/components/BottomNavBar';
import { MarketDetailScreen } from '../features/market-details';
import { TelemetryScreen } from '../features/telemetry-settings';
import { WatchlistScreen } from '../features/watchlist';
import type { RootStackParamList } from './types';

const Tab = createBottomTabNavigator<RootStackParamList>();

// Bottom Tabs, not Native Stack - these four screens are lateral tab switches
// (BottomNavBar), not hierarchical "go deeper" navigation, and a Stack Navigator is the
// wrong tool for that: navigate() to a different route pushes a brand-new screen instance
// onto the stack, so every tab switch was a full fresh mount (every hook re-running, the
// WS store re-subscribing, layout recalculating) regardless of screenOptions.animation -
// that setting only hid the slide transition, not the underlying remount cost, which was
// the actual cause of the reported "laggy" tab switching. A Tab Navigator keeps a visited
// screen mounted after its first visit and switching is a pure visibility toggle - no
// remount, no re-fetch, no dropped frames from re-running effects on every switch.
//
// BottomNavBar is the Navigator's own tabBar (rendered once here), not duplicated inside
// each screen's own JSX as it was under the Stack setup - it already reads the active
// route and navigates via the standard useNavigation()/useNavigationState() hooks, so it
// needs no changes to work as a custom tabBar.
export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Terminal"
        tabBar={() => <BottomNavBar />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Terminal" component={MarketDetailScreen} />
        <Tab.Screen name="Markets" component={WatchlistScreen} />
        {/* Both "Telemetry" and "Settings" tabs route to the same TelemetryScreen
        (ADR-M10 — Figma specifies one combined destination for both). */}
        <Tab.Screen name="Telemetry" component={TelemetryScreen} />
        <Tab.Screen name="Settings" component={TelemetryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

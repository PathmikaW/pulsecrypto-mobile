import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomNavBar } from '../core/components/BottomNavBar';
import { MarketDetailScreen } from '../features/market-details';
import { TelemetryScreen } from '../features/telemetry-settings';
import { WatchlistScreen } from '../features/watchlist';
import type { RootStackParamList } from './types';

const Tab = createBottomTabNavigator<RootStackParamList>();

// Bottom Tabs, not Native Stack: these are lateral tab switches, and a Stack remounts the screen on every navigate (ADR-M11).
// BottomNavBar is the navigator's own tabBar, rendered once here.
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
        <Tab.Screen name="Telemetry" component={TelemetryScreen} />
        <Tab.Screen name="Settings" component={TelemetryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

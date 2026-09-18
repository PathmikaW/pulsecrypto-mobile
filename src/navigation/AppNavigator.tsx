import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MarketDetailScreen } from '../features/market-details';
import { TelemetryScreen } from '../features/telemetry-settings';
import { WatchlistScreen } from '../features/watchlist';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Native Stack (ADR-M8 tech stack) — the Figma-styled BottomNavBar chrome is added in
// Phase 4 alongside the real screens; this establishes routing between all five screens.
// Both "Telemetry" and "Settings" tabs route to the same TelemetryScreen (ADR-M10 — Figma
// specifies one combined destination for both).
export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Terminal" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Terminal" component={MarketDetailScreen} />
        <Stack.Screen name="Markets" component={WatchlistScreen} />
        <Stack.Screen name="Telemetry" component={TelemetryScreen} />
        <Stack.Screen name="Settings" component={TelemetryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

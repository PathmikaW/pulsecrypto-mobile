import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
// Per-weight subpath imports, not the package's barrel index - the barrel unconditionally
// requires every weight + italic variant (~50 files, ~15MB across all three families),
// which Metro then bundles regardless of which named exports are actually used. Each
// subpath's own index.js requires only that one file (ADR-M10 perf pass).
import { HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono/700Bold';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from './core/api/queryClient';
import { ErrorBoundary } from './core/components/ErrorBoundary';
import { useWebSocket } from './core/hooks/useWebSocket';
import { AccountDrawer } from './features/market-details';
import './core/i18n/i18n';
import { AppNavigator } from './navigation/AppNavigator';

// Kept visible until the design-token fonts finish loading (below) - without this, the app
// would render one frame with the OS system font before swapping to JetBrains Mono/Inter/
// Hanken Grotesk, a visible flash that the ADR-M4 "no lag/jank" standard rules out.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  useWebSocket();
  return (
    <>
      <AppNavigator />
      <AccountDrawer />
    </>
  );
}

export default function App() {
  // Every fontFamily value in core/theme/typography.ts must have a matching entry here -
  // the two are meant to be kept in lockstep; a token referencing a weight not loaded here
  // silently falls back to the system font (exactly the bug this fixes).
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    Inter_400Regular,
    Inter_700Bold,
    HankenGrotesk_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </QueryClientProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
// Per-weight subpath imports: the package barrel makes Metro bundle every weight and italic (~15MB) (ADR-M10).
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

// Held until fonts load to avoid a one-frame flash of the system font (ADR-M4).
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
  // Every fontFamily in core/theme/typography.ts needs a matching entry here, or it silently falls back to the system font.
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

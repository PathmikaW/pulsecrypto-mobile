import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from './core/api/queryClient';
import { ErrorBoundary } from './core/components/ErrorBoundary';
import { useWebSocket } from './core/hooks/useWebSocket';
import { AccountDrawer } from './features/market-details';
import './core/i18n/i18n';
import { AppNavigator } from './navigation/AppNavigator';

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

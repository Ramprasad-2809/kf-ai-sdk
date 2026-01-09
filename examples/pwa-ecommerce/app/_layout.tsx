import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { QueryProvider } from '../providers/QueryProvider';
import { AuthProvider } from '../providers/AuthProvider';
import { useEffect } from 'react';
import { initializeApi } from '../utils/apiClient';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  // Initialize API on mount
  useEffect(() => {
    initializeApi().catch((error) => {
      console.error('Failed to initialize API:', error);
    });
  }, []);

  return (
    <QueryProvider>
      <AuthProvider>
        <PaperProvider>
          <Slot />
          <Toast />
        </PaperProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

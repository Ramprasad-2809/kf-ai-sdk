import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function Index() {
  const { role, isLoading } = useAuth();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect based on auth state
  if (!role) {
    return <Redirect href="/login" />;
  }

  // Redirect to appropriate home based on role
  if (role === 'Buyer') {
    return <Redirect href="/(buyer)/products" />;
  } else {
    return <Redirect href="/(seller)/manage" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

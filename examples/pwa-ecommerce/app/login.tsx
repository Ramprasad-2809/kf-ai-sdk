import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { Card } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, typography } from '../constants/theme';
import { Role } from '../types';

export default function LoginScreen() {
  const { setRole } = useAuth();

  const handleLogin = async (role: Role) => {
    await setRole(role);

    // Navigate to appropriate screen
    if (role === 'Buyer') {
      router.replace('/(buyer)/products');
    } else {
      router.replace('/(seller)/manage');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to PrimeStore</Text>
        <Text style={styles.subtitle}>Select your role to continue</Text>

        <View style={styles.cardsContainer}>
          <Pressable onPress={() => handleLogin('Buyer')} style={styles.cardPressable}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.cardIcon}>🛒</Text>
                <Text style={styles.cardTitle}>Login as Buyer</Text>
                <Text style={styles.cardDescription}>Browse and shop products</Text>
              </Card.Content>
            </Card>
          </Pressable>

          <Pressable onPress={() => handleLogin('Seller')} style={styles.cardPressable}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.cardIcon}>📦</Text>
                <Text style={styles.cardTitle}>Login as Seller</Text>
                <Text style={styles.cardDescription}>Manage your products</Text>
              </Card.Content>
            </Card>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Built with Expo Router + KF AI SDK
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray500,
    marginBottom: spacing.xxl,
  },
  cardsContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: spacing.md,
    width: '100%',
  },
  cardPressable: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.background,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  cardContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.gray500,
  },
  footer: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: spacing.xxl,
  },
});

import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { colors, spacing, typography } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.text}>Page Not Found</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go to Home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 72,
    fontWeight: '700',
    color: colors.gray300,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.h2,
    color: colors.gray900,
    marginBottom: spacing.lg,
  },
  link: {
    marginTop: spacing.md,
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

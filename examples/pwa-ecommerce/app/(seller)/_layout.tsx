import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/theme';

export default function SellerLayout() {
  const { role } = useAuth();

  // Protect route - only sellers can access
  if (role !== 'Seller') {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.slate900,
        },
        headerTintColor: colors.background,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="manage"
        options={{
          title: 'Product Management',
        }}
      />
    </Stack>
  );
}

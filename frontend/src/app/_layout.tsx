import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, View, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { authClient } from '@/lib/auth-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

    // Session
  const {
    data: session,
    isPending,
    refetch,
  } = authClient.useSession();

  // Re-check the session when the root layout loads.
  useEffect(() => {
    refetch();
  }, [refetch]);

  const isAuthenticated = Boolean(session?.user);

  // Auth loading
  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      <Stack>
        {/* Public routes */}
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen
            name="login"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="signup"
            options={{ headerShown: false }}
          />
        </Stack.Protected>

        {/* Protected routes */}
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="services/[id]"
            options={{ title: 'Service' }}
          />
          <Stack.Screen
            name="book/[serviceId]"
            options={{ title: 'Book Service' }}
          />
          <Stack.Screen
            name="booking/[id]/confirmation"
            options={{ title: 'Booking Confirmed' }}
          />
          <Stack.Screen
            name="booking/[id]/status"
            options={{ title: 'Booking Status' }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
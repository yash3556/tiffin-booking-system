import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="services/[id]" options={{ title: 'Service' }} />
        <Stack.Screen name="book/[serviceId]" options={{ title: 'Book Service' }} />
        <Stack.Screen name="booking/[id]/confirmation" options={{ title: 'Booking Confirmed' }} />
        <Stack.Screen name="booking/[id]/status" options={{ title: 'Booking Status' }} />
      </Stack>
    </ThemeProvider>
  );
}
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { id, serviceName, servicePrice } = useLocalSearchParams<{
    id: string;
    serviceName: string;
    servicePrice: string;
  }>();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>Booking Confirmed!</ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.row}>
            <ThemedText themeColor="textSecondary">Booking ID</ThemedText>
            <ThemedText type="small" style={styles.idText}>{id}</ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText themeColor="textSecondary">Service</ThemedText>
            <ThemedText type="default">{serviceName}</ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText themeColor="textSecondary">Amount</ThemedText>
            <ThemedText type="default">₹{servicePrice}</ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText themeColor="textSecondary">Status</ThemedText>
            <StatusBadge status="PENDING" />
          </View>
        </ThemedView>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() =>
            router.push({
              pathname: '/booking/[id]/status',
              params: { id },
            })
          }>
          <ThemedText type="smallBold" style={styles.buttonText}>
            View Booking Status
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.buttonSecondary, pressed && styles.pressed]}
          onPress={() => router.replace('/')}>
          <ThemedText type="smallBold">Back to Services</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.three,
  },
  heading: { paddingVertical: Spacing.three },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idText: { fontFamily: 'monospace', flexShrink: 1 },
  button: {
    marginTop: Spacing.four,
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  buttonSecondary: {
    marginTop: Spacing.two,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: { color: '#fff' },
  pressed: { opacity: 0.7 },
});

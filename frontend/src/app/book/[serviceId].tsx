import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createBooking } from '@/services/bookingService';
import { createCustomer } from '@/services/customerService';

export default function BookingFormScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { serviceId, serviceName, servicePrice } = useLocalSearchParams<{
    serviceId: string;
    serviceName: string;
    servicePrice: string;
  }>();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const customer = await createCustomer({ name: name.trim(), phone: phone.trim() });
      const booking = await createBooking({ customerId: customer.id, serviceId });
      router.replace({
        pathname: '/booking/[id]/confirmation',
        params: {
          id: booking.id,
          serviceName,
          servicePrice,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>Book Service</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.sub}>{serviceName}</ThemedText>

        <View style={styles.form}>
          <ThemedText type="small">Your Name</ThemedText>
          <TextInput
            style={inputStyle}
            placeholder="e.g. Yash"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!submitting}
          />

          <ThemedText type="small">Phone Number</ThemedText>
          <TextInput
            style={inputStyle}
            placeholder="e.g. 9876543210"
            placeholderTextColor={theme.textSecondary}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!submitting}
          />

          {error ? (
            <ThemedText type="small" style={styles.errorText}>{error}</ThemedText>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              (submitting || pressed) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              {submitting ? 'Booking…' : `Confirm Booking — ₹${servicePrice}`}
            </ThemedText>
          </Pressable>
        </View>
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
  heading: { paddingTop: Spacing.three },
  sub: { marginBottom: Spacing.three },
  form: { gap: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  errorText: { color: '#DC2626' },
  button: {
    marginTop: Spacing.two,
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  buttonText: { color: '#fff' },
  buttonDisabled: { opacity: 0.6 },
});

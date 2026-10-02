import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { createBooking } from '@/services/bookingService';
import { styles } from '@/styles/booking.styles';

export default function BookingFormScreen() {
  // Route params
  const router = useRouter();
  const theme = useTheme();

  const { serviceId, serviceName, servicePrice } =
    useLocalSearchParams<{
      serviceId: string;
      serviceName: string;
      servicePrice: string;
    }>();

  // State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actions
  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Backend resolves the customer from the authenticated session.
      const booking = await createBooking({
        serviceId,
      });

      router.replace({
        pathname: '/booking/[id]/confirmation',
        params: {
          id: booking.id,
          serviceName,
          servicePrice,
        },
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Booking failed. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // UI
  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      borderColor: theme.backgroundElement,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          Book Service
        </ThemedText>

        <ThemedText themeColor="textSecondary" style={styles.sub}>
          {serviceName}
        </ThemedText>

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
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              (submitting || pressed) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <ThemedText type="smallBold" style={styles.buttonText}>
              {submitting
                ? 'Booking…'
                : `Confirm Booking — ₹${servicePrice}`}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { LoadingView } from '@/components/loading-view';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  getBooking,
  getBookingHistory,
  updateBookingStatus,
} from '@/services/bookingService';
import type { Booking, BookingHistory, BookingStatus } from '@/types/booking';

export default function BookingStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const [bookingData, historyData] = await Promise.all([
      getBooking(id),
      getBookingHistory(id),
    ]);

    setBooking(bookingData);
    setHistory(historyData);
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Failed to load booking.');
  } finally {
    setLoading(false);
  }
}, [id]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  async function handleStatusChange(status: BookingStatus) {
  if (!booking) return;

  setCancelling(true);
  setError(null);

  try {
    const updated = await updateBookingStatus(id, status);
    setBooking(updated);
    const updatedHistory = await getBookingHistory(id);
    setHistory(updatedHistory);
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Failed to update booking.');
  } finally {
    setCancelling(false);
  }
}

  if (loading) return <LoadingView message="Loading booking…" />;
  if (error && !booking) return <ErrorView message={error} onRetry={fetchBooking} />;
  if (!booking) return null;

  const canCancel = booking.status === 'PENDING';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>Booking Status</ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.row}>
            <ThemedText themeColor="textSecondary">Booking ID</ThemedText>
            <ThemedText type="small" style={styles.idText}>{booking.id}</ThemedText>
          </View>
          {booking.service ? (
            <View style={styles.row}>
              <ThemedText themeColor="textSecondary">Service</ThemedText>
              <ThemedText type="default">{booking.service.name}</ThemedText>
            </View>
          ) : null}
          {booking.customer ? (
            <View style={styles.row}>
              <ThemedText themeColor="textSecondary">Customer</ThemedText>
              <ThemedText type="default">{booking.customer.name}</ThemedText>
            </View>
          ) : null}
          <View style={styles.row}>
            <ThemedText themeColor="textSecondary">Status</ThemedText>
            <StatusBadge status={booking.status} />
          </View>
        </ThemedView>

                {history.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">Status History</ThemedText>

            {history.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <ThemedText type="small">
                  {item.fromStatus
                    ? `${item.fromStatus} → ${item.toStatus}`
                    : item.toStatus}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(item.createdAt).toLocaleString()}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        ) : null}

        {error ? (
          <ThemedText type="small" style={styles.errorText}>{error}</ThemedText>
        ) : null}
        {booking.status === 'PENDING' && (
  <Pressable
    onPress={() => handleStatusChange('CONFIRMED')}
    disabled={cancelling}
    style={{
      padding: Spacing.three,
      borderRadius: 10,
      marginTop: Spacing.three,
      backgroundColor: '#222',
      alignItems: 'center',
    }}>
    <ThemedText style={{ color: '#fff' }}>
      {cancelling ? 'Updating...' : 'Confirm Booking'}
    </ThemedText>
  </Pressable>
)}

{booking.status === 'CONFIRMED' && (
  <Pressable
    onPress={() => handleStatusChange('COMPLETED')}
    disabled={cancelling}
    style={{
      padding: Spacing.three,
      borderRadius: 10,
      marginTop: Spacing.three,
      backgroundColor: '#222',
      alignItems: 'center',
    }}>
    <ThemedText style={{ color: '#fff' }}>
      {cancelling ? 'Updating...' : 'Complete Booking'}
    </ThemedText>
  </Pressable>
)}
        {canCancel ? (
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              (cancelling || pressed) && styles.buttonDisabled,
            ]}
            onPress={() => handleStatusChange('CANCELLED')}
            disabled={cancelling}>
            <ThemedText type="smallBold" style={styles.cancelText}>
              {cancelling ? 'Updating...' : 'Cancel Booking'}
            </ThemedText>
          </Pressable>
        ) : null}
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
    historyRow: {
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  idText: { fontFamily: 'monospace', flexShrink: 1 },
  errorText: { color: '#DC2626', marginTop: Spacing.two },
  cancelButton: {
    marginTop: Spacing.four,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  cancelText: { color: '#DC2626' },
  buttonDisabled: { opacity: 0.5 },
});

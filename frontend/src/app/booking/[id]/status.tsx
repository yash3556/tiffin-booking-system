import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { LoadingView } from '@/components/loading-view';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import {
  getBooking,
  getBookingHistory,
  updateBookingStatus,
} from '@/services/bookingService';

import type {
  Booking,
  BookingHistory,
  BookingStatus,
} from '@/types/booking';

import { styles } from '@/styles/status.styles';

export default function BookingStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Data fetching
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

  // Effects
  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Actions
  async function handleStatusChange(status: BookingStatus) {
    if (!booking) return;

    setUpdating(true);
    setError(null);

    try {
      const updatedBooking = await updateBookingStatus(id, status);
      const updatedHistory = await getBookingHistory(id);

      setBooking(updatedBooking);
      setHistory(updatedHistory);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to update booking.'
      );
    } finally {
      setUpdating(false);
    }
  }

  // Loading and error states
  if (loading) {
    return <LoadingView message="Loading booking…" />;
  }

  if (error && !booking) {
    return <ErrorView message={error} onRetry={fetchBooking} />;
  }

  if (!booking) {
    return null;
  }

  const canConfirm = booking.status === 'PENDING';
  const canComplete = booking.status === 'CONFIRMED';
  const canCancel = booking.status === 'PENDING';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          Booking Status
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.row}>
            <ThemedText themeColor="textSecondary">
              Booking ID
            </ThemedText>
            <ThemedText type="small" style={styles.idText}>
              {booking.id}
            </ThemedText>
          </View>

          {booking.service ? (
            <View style={styles.row}>
              <ThemedText themeColor="textSecondary">
                Service
              </ThemedText>
              <ThemedText type="default">
                {booking.service.name}
              </ThemedText>
            </View>
          ) : null}

          {booking.customer ? (
            <View style={styles.row}>
              <ThemedText themeColor="textSecondary">
                Customer
              </ThemedText>
              <ThemedText type="default">
                {booking.customer.name}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.row}>
            <ThemedText themeColor="textSecondary">
              Status
            </ThemedText>
            <StatusBadge status={booking.status} />
          </View>
        </ThemedView>

        {history.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">
              Status History
            </ThemedText>

            {history.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <ThemedText type="small">
                  {item.fromStatus
                    ? `${item.fromStatus} → ${item.toStatus}`
                    : item.toStatus}
                </ThemedText>

                <ThemedText
                  type="small"
                  themeColor="textSecondary">
                  {new Date(item.createdAt).toLocaleString()}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        ) : null}

        {error ? (
          <ThemedText type="small" style={styles.errorText}>
            {error}
          </ThemedText>
        ) : null}

        {canConfirm ? (
          <Pressable
            onPress={() => handleStatusChange('CONFIRMED')}
            disabled={updating}
            style={({ pressed }) => [
              styles.primaryButton,
              (updating || pressed) && styles.buttonDisabled,
            ]}>
            <ThemedText style={styles.primaryButtonText}>
              {updating ? 'Updating...' : 'Confirm Booking'}
            </ThemedText>
          </Pressable>
        ) : null}

        {canComplete ? (
          <Pressable
            onPress={() => handleStatusChange('COMPLETED')}
            disabled={updating}
            style={({ pressed }) => [
              styles.primaryButton,
              (updating || pressed) && styles.buttonDisabled,
            ]}>
            <ThemedText style={styles.primaryButtonText}>
              {updating ? 'Updating...' : 'Complete Booking'}
            </ThemedText>
          </Pressable>
        ) : null}

        {canCancel ? (
          <Pressable
            onPress={() => handleStatusChange('CANCELLED')}
            disabled={updating}
            style={({ pressed }) => [
              styles.cancelButton,
              (updating || pressed) && styles.buttonDisabled,
            ]}>
            <ThemedText type="smallBold" style={styles.cancelText}>
              {updating ? 'Updating...' : 'Cancel Booking'}
            </ThemedText>
          </Pressable>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}
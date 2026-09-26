import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { BookingStatus } from '@/types/booking';
import type { TransactionStatus } from '@/types/transaction';

type Status = BookingStatus | TransactionStatus;

const STATUS_COLORS: Record<Status, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  CONFIRMED: { bg: '#D1FAE5', text: '#065F46' },
  COMPLETED: { bg: '#DBEAFE', text: '#1E40AF' },
  CANCELLED: { bg: '#FEE2E2', text: '#991B1B' },
  SUCCESS: { bg: '#D1FAE5', text: '#065F46' },
  FAILED: { bg: '#FEE2E2', text: '#991B1B' },
};

type Props = {
  status: Status;
};

export function StatusBadge({ status }: Props) {
  const colors = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <ThemedText style={[styles.text, { color: colors.text }]}>{status}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

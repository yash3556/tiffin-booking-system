import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { LoadingView } from '@/components/loading-view';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getTransactions } from '@/services/transactionService';
import type { Transaction } from '@/types/transaction';

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  if (loading) return <LoadingView message="Loading history…" />;
  if (error) return <ErrorView message={error} onRetry={fetchTransactions} />;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>History</ThemedText>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              No transactions yet.
            </ThemedText>
          }
          renderItem={({ item }) => <TransactionRow item={item} />}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function TransactionRow({ item }: { item: Transaction }) {
  const date = new Date(item.createdAt).toLocaleDateString();
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.cardTop}>
        <ThemedText type="small" style={styles.idText}>{item.id}</ThemedText>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.cardBottom}>
        <ThemedText themeColor="textSecondary" type="small">{date}</ThemedText>
        <ThemedText type="default">₹{item.amount}</ThemedText>
      </View>
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
  list: { gap: Spacing.two },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idText: { fontFamily: 'monospace', flexShrink: 1, marginRight: Spacing.two },
  empty: { textAlign: 'center', marginTop: Spacing.six },
});

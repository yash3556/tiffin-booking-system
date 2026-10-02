import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { LoadingView } from '@/components/loading-view';
import { StatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authClient } from '@/lib/auth-client';
import { getTransactions } from '@/services/transactionService';
import { styles } from '@/styles/history.styles';
import type { Transaction } from '@/types/transaction';

export default function HistoryScreen() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Session
  const { refetch: refetchSession } = authClient.useSession();

  // Data fetching
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to load history.';

      if (message === 'Customer onboarding is required') {
        router.replace('/customer-onboarding');
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Actions
    const handleLogout = async () => {
    setError(null);
    setIsLoggingOut(true);

    try {
      const result = await authClient.signOut();

        if (result.error) {
        setError(
          result.error.message || 'Logout failed. Please try again.',
        );
        return;
      }

      // Refresh the shared auth state after the server session is removed.
      await refetchSession();

      router.replace('/login');
    } catch {
      setError('Unable to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Loading and error states
  if (loading) {
    return <LoadingView message="Loading history…" />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchTransactions} />;
  }

  // UI
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>
          History
        </ThemedText>

        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText
              themeColor="textSecondary"
              style={styles.empty}
            >
              No transactions yet.
            </ThemedText>
          }
          renderItem={({ item }) => <TransactionRow item={item} />}
        />

        <Pressable
          onPress={handleLogout}
          disabled={isLoggingOut}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && !isLoggingOut && styles.logoutButtonPressed,
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
        >
          {isLoggingOut ? (
            <ActivityIndicator />
          ) : (
            <ThemedText style={styles.logoutButtonText}>
              Logout
            </ThemedText>
          )}
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

function TransactionRow({ item }: { item: Transaction }) {
  const date = new Date(item.createdAt).toLocaleDateString();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.cardTop}>
        <ThemedText type="small" style={styles.idText}>
          {item.id}
        </ThemedText>

        <StatusBadge status={item.status} />
      </View>

      <View style={styles.cardBottom}>
        <ThemedText themeColor="textSecondary" type="small">
          {date}
        </ThemedText>

        <ThemedText type="default">
          ₹{item.amount}
        </ThemedText>
      </View>
    </ThemedView>
  );
}
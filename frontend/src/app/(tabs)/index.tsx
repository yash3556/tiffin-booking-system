import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView } from '@/components/error-view';
import { LoadingView } from '@/components/loading-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getServices } from '@/services/serviceService';
import type { Service } from '@/types/service';
import { styles } from '@/styles/services.styles';

export default function ServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServices();
      setServices(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  fetchServices();
  }, [fetchServices]);

  if (loading) return <LoadingView message="Loading services…" />;
  if (error) return <ErrorView message={error} onRetry={fetchServices} />;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>Services</ThemedText>
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              No services available.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                  router.push({
                    pathname: '/services/[id]',
                    params: {
                      id: item.id,
                      name: item.name,
                      price: String(item.price),
                    },
                  })
                }
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="default">{item.name}</ThemedText>
                <ThemedText themeColor="textSecondary">₹{item.price}</ThemedText>
              </ThemedView>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}



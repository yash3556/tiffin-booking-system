import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { styles } from '@/styles/service-detail.styles';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id, name, price } = useLocalSearchParams<{
    id: string;
    name: string;
    price: string;
  }>();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.heading}>{name}</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.row}>
            <ThemedText themeColor="textSecondary">Price</ThemedText>
            <ThemedText type="default">₹{price}</ThemedText>
          </View>
        </ThemedView>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() =>
            router.push({
              pathname: '/book/[serviceId]',
              params: { serviceId: id, serviceName: name, servicePrice: price },
            })
          }>
          <ThemedText type="smallBold" style={styles.buttonText}>
            Book Now
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}


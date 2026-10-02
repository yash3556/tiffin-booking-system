import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createCustomer } from '@/services/customerService';
import { styles } from '@/styles/customer-onboarding.styles';

export default function CustomerOnboardingScreen() {
  // State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Actions
  const handleSubmit = async () => {
    setError('');

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedPhone) {
      setError('Please enter your name and phone number.');
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsLoading(true);

    try {
      await createCustomer({
        name: trimmedName,
        phone: trimmedPhone,
      });

      router.replace('/');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to complete onboarding. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // UI
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Complete Your Profile</Text>

        <Text style={styles.subtitle}>
          Add your details to continue using Tiffin Hub.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isLoading}
            style={styles.input}
          />

          <Text style={styles.label}>Phone Number</Text>

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your 10-digit phone number"
            keyboardType="phone-pad"
            maxLength={10}
            editable={!isLoading}
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.button,
              pressed && !isLoading && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
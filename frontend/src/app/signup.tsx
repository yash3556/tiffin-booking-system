import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { authClient } from '@/lib/auth-client';
import { styles } from '@/styles/signup.styles';

export default function SignupScreen() {
  // State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Actions
  const handleSignup = async () => {
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      if (result.error) {
        setError(result.error.message || 'Signup failed. Please try again.');
        return;
      }

      router.replace('/login');
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // UI
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>
          Sign up to start using Tiffin Hub.
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

          <Text style={styles.label}>Email</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!isLoading}
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
            editable={!isLoading}
            style={styles.input}
          />

          <Text style={styles.label}>Confirm Password</Text>

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            secureTextEntry
            editable={!isLoading}
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={handleSignup}
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
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>

            <Pressable
              onPress={() => router.replace('/login')}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Login</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
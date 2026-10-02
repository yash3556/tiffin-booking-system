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
import { styles } from '@/styles/login.styles';

export default function LoginScreen() {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Actions
  const handleLogin = async () => {
    setError('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: trimmedEmail,
        password,
      });

      if (result.error) {
        setError(result.error.message || 'Login failed. Please try again.');
        return;
      }

      router.replace('/');
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
        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>
          Login to continue to Tiffin Hub.
        </Text>

        <View style={styles.form}>
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
            placeholder="Enter your password"
            secureTextEntry
            editable={!isLoading}
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={handleLogin}
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
              <Text style={styles.buttonText}>Login</Text>
            )}
          </Pressable>
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Don't have an account? </Text>

            <Pressable
              onPress={() => router.replace('/signup')}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
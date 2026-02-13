import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Dimensions,
} from 'react-native';
import { useAuth } from '../services/AuthContext';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  // Can be username OR email
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanedIdentifier = (identifier || '').trim();
    const cleanedPassword = (password || '').trim();

    if (!cleanedIdentifier || !cleanedPassword) {
      setError('Please enter your username or email and password');
      return;
    }

    setError('');
    setLoading(true);
    try {
      // Pass identifier to AuthContext; it will authenticate using username or email.
      await login(cleanedIdentifier, cleanedPassword);
    } catch (e) {
      setError(e?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>&#x1F30D;</Text>
            </View>
            <Text style={styles.appName}>Nearby Traveler</Text>
            <Text style={styles.tagline}>Connect with travelers & locals nearby</Text>
          </View>

          <View style={styles.formSection}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email or Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email or username"
                placeholderTextColor="#9CA3AF"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                textContentType="username"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotButton} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerSection}>
            <Text style={styles.registerPrompt}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  brandSection: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 8 },
  tagline: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  formSection: { marginBottom: 32 },
  errorContainer: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  inputContainer: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827' },
  loginButton: { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  forgotButton: { alignItems: 'center', marginTop: 16 },
  forgotText: { color: '#F97316', fontSize: 14, fontWeight: '500' },
  registerSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  registerPrompt: { color: '#6B7280', fontSize: 15 },
  registerLink: { color: '#F97316', fontSize: 15, fontWeight: '700' }
});
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Username, email, and password are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.register({ username: username.trim(), email: email.trim(), password, fullName: fullName.trim(), city: city.trim() || 'Los Angeles' });
      await login(email.trim(), password);
    } catch (e) {
      setError(e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the Nearby Traveler community</Text>
          </View>
          {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}
          <View style={styles.inputContainer}><Text style={styles.inputLabel}>Full Name</Text><TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#9CA3AF" value={fullName} onChangeText={setFullName} autoCapitalize="words" /></View>
          <View style={styles.inputContainer}><Text style={styles.inputLabel}>Username *</Text><TextInput style={styles.input} placeholder="Choose a username" placeholderTextColor="#9CA3AF" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} /></View>
          <View style={styles.inputContainer}><Text style={styles.inputLabel}>Email *</Text><TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /></View>
          <View style={styles.inputContainer}><Text style={styles.inputLabel}>Password *</Text><TextInput style={styles.input} placeholder="Create a password" placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry /></View>
          <View style={styles.inputContainer}><Text style={styles.inputLabel}>Home City</Text><TextInput style={styles.input} placeholder="e.g. Los Angeles" placeholderTextColor="#9CA3AF" value={city} onChangeText={setCity} autoCapitalize="words" /></View>
          <TouchableOpacity style={[styles.registerButton, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Create Account</Text>}
          </TouchableOpacity>
          <View style={styles.loginSection}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.loginLink}>Sign In</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 24 },
  header: { marginBottom: 28 },
  backButton: { marginBottom: 16 },
  backText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  errorContainer: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827' },
  registerButton: { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  registerButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  loginSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 },
  loginPrompt: { color: '#6B7280', fontSize: 15 },
  loginLink: { color: '#F97316', fontSize: 15, fontWeight: '700' },
});

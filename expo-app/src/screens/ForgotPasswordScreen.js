import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch('https://nearbytraveler.org/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
      setSent(true);
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}><View style={styles.content}>
        <Text style={styles.icon}>&#x1F4E7;</Text>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>If an account exists for {email}, we sent password reset instructions.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}><Text style={styles.buttonText}>Back to Sign In</Text></TouchableOpacity>
      </View></SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}><View style={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your email and we will send reset instructions.</Text>
      <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /></View>
      <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleReset} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
      </TouchableOpacity>
    </View></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  backButton: { position: 'absolute', top: 20, left: 0 },
  backText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
  icon: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  inputContainer: { marginBottom: 20 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827' },
  button: { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});

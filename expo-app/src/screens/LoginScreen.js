import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Dimensions, useColorScheme,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../services/AuthContext';

const { width } = Dimensions.get('window');

const DARK = {
  bg: '#1c1c1e',
  bgSecondary: '#2c2c2e',
  border: '#38383a',
  text: '#ffffff',
  textMuted: '#8e8e93',
  inputBg: '#2c2c2e',
  inputBorder: '#38383a',
  errorBg: '#3d1f1f',
  errorBorder: '#5c2a2a',
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';

  // Can be username OR email
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);

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

  const containerStyle = { backgroundColor: dark ? DARK.bg : '#FFFFFF' };
  const appNameStyle = { color: dark ? DARK.text : '#111827' };
  const taglineStyle = { color: dark ? DARK.textMuted : '#6B7280' };
  const errorContainerStyle = { backgroundColor: dark ? DARK.errorBg : '#FEF2F2', borderColor: dark ? DARK.errorBorder : '#FECACA' };
  const inputLabelStyle = { color: dark ? DARK.text : '#374151' };
  const inputStyle = { backgroundColor: dark ? DARK.inputBg : '#F9FAFB', borderColor: dark ? DARK.inputBorder : '#E5E7EB', color: dark ? DARK.text : '#111827', selectionColor: dark ? 'rgba(249,115,22,0.4)' : 'rgba(59,130,246,0.4)' };
  const placeholderColor = dark ? '#8e8e93' : '#9CA3AF';
  const eyeIconColor = dark ? '#8e8e93' : '#6B7280';
  const registerPromptStyle = { color: dark ? DARK.textMuted : '#6B7280' };

  return (
    <SafeAreaView style={[styles.container, containerStyle]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandSection}>
            <View style={styles.textLogoRow}>
              <Text style={[styles.textLogoBlue, dark && styles.textLogoBlueDark]}>Nearby</Text>
              <Text style={[styles.textLogoOrange, dark && styles.textLogoOrangeDark]}>Traveler</Text>
            </View>
            <Text style={[styles.tagline, taglineStyle]}>Connect with travelers & locals nearby</Text>
          </View>

          <View style={styles.formSection}>
            {error ? (
              <View style={[styles.errorContainer, errorContainerStyle]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, inputLabelStyle]}>Email or Username</Text>
              <TextInput
                style={[styles.input, inputStyle]}
                placeholder="Enter your email or username"
                placeholderTextColor={placeholderColor}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                textContentType="username"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, inputLabelStyle]}>Password</Text>
              <TouchableOpacity activeOpacity={1} onPress={() => passwordRef.current?.focus()} style={styles.passwordTapArea}>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, inputStyle, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor={placeholderColor}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={eyeIconColor} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
            <Text style={[styles.registerPrompt, registerPromptStyle]}>Don't have an account?</Text>
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
  textLogoRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  textLogoBlue: { fontSize: 32, fontWeight: '700', color: '#3B82F6' },
  textLogoBlueDark: { color: '#60A5FA' },
  textLogoOrange: { fontSize: 32, fontWeight: '700', color: '#F97316' },
  textLogoOrangeDark: { color: '#FB923C' },
  tagline: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  formSection: { marginBottom: 32 },
  errorContainer: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  inputContainer: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827' },
  passwordTapArea: { marginBottom: 4 },
  passwordInputWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeButton: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  loginButton: { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  forgotButton: { alignItems: 'center', marginTop: 16 },
  forgotText: { color: '#F97316', fontSize: 14, fontWeight: '500' },
  registerSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  registerPrompt: { color: '#6B7280', fontSize: 15 },
  registerLink: { color: '#F97316', fontSize: 15, fontWeight: '700' }
});
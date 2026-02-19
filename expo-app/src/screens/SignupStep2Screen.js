import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, useColorScheme,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ORANGE = '#F97316';
const SIGNUP_DATA_KEY = 'signup_data';

const DARK = {
  bg: '#1c1c1e',
  text: '#ffffff',
  textMuted: '#8e8e93',
  inputBg: '#2c2c2e',
  inputBorder: '#38383a',
  errorBg: '#3d1f1f',
  errorBorder: '#5c2a2a',
};

export default function SignupStep2Screen({ navigation, route }) {
  const { userType } = route?.params || {};
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'local': return 'Nearby Local';
      case 'traveler': return 'Nearby Traveler';
      case 'business': return 'Nearby Business';
      default: return 'User';
    }
  };

  const handleContinue = async () => {
    setError('');
    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedUsername || !trimmedEmail || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (trimmedUsername.length < 6) {
      setError('Username must be at least 6 characters.');
      return;
    }
    if (trimmedUsername.length > 12) {
      setError('Username must be 12 characters or less.');
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
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const signupData = {
        userType: userType || 'local',
        name: trimmedName,
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      };
      await AsyncStorage.setItem(SIGNUP_DATA_KEY, JSON.stringify(signupData));
      const nextStep = userType === 'business' ? 'BusinessSignupWebView' : 'SignupStep3';
      navigation.navigate(nextStep, { userType: userType || 'local' });
    } catch (e) {
      setError('Could not save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    navigation.replace('SignupStep1');
    return null;
  }

  const containerStyle = { backgroundColor: dark ? DARK.bg : '#FFFFFF' };
  const stepLabelStyle = { color: dark ? DARK.textMuted : '#6B7280' };
  const titleStyle = { color: dark ? DARK.text : '#111827' };
  const subtitleStyle = { color: dark ? DARK.textMuted : '#6B7280' };
  const errorContainerStyle = dark ? { backgroundColor: DARK.errorBg, borderColor: DARK.errorBorder } : {};
  const inputLabelStyle = { color: dark ? DARK.text : '#374151' };
  const inputStyle = dark ? { backgroundColor: DARK.inputBg, borderColor: DARK.inputBorder, color: DARK.text, selectionColor: 'rgba(249,115,22,0.4)' } : { selectionColor: 'rgba(59,130,246,0.4)' };
  const placeholderColor = dark ? '#8e8e93' : '#9CA3AF';
  const eyeIconColor = dark ? '#8e8e93' : '#6B7280';

  return (
    <SafeAreaView style={[styles.container, containerStyle]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={[styles.stepLabel, stepLabelStyle]}>Step 2 of 3</Text>
          </View>

          <Text style={[styles.title, titleStyle]}>Create your account</Text>
          <Text style={[styles.subtitle, subtitleStyle]}>As {getUserTypeLabel()}</Text>

          {error ? (
            <View style={[styles.errorContainer, errorContainerStyle]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Full Name *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="Your name"
              placeholderTextColor={placeholderColor}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Username * (min 6 characters)</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="Choose a username (6-12 chars)"
              placeholderTextColor={placeholderColor}
              value={username}
              onChangeText={(t) => setUsername(t.replace(/\s/g, '_').slice(0, 12))}
              maxLength={12}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Email *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="your@email.com"
              placeholderTextColor={placeholderColor}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Password * (min 8 characters)</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => passwordRef.current?.focus()}
              style={styles.passwordTapArea}
            >
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, inputStyle, styles.passwordInput]}
                  placeholder="Create a password"
                  placeholderTextColor={placeholderColor}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
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
            <View style={styles.passwordHintRow}>
              <Text style={[styles.passwordHint, dark && { color: DARK.textMuted }]}>Use a strong password. Tap the field above to type your own.</Text>
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Confirm Password *</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => confirmPasswordRef.current?.focus()}
              style={styles.passwordTapArea}
            >
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  ref={confirmPasswordRef}
                  style={[styles.input, inputStyle, styles.passwordInput]}
                  placeholder="Confirm your password"
                  placeholderTextColor={placeholderColor}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={eyeIconColor} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, loading && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Continue →</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { paddingVertical: 8, paddingRight: 16 },
  backText: { color: ORANGE, fontSize: 17, fontWeight: '600' },
  stepLabel: { flex: 1, textAlign: 'right', color: '#6B7280', fontSize: 14 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 24 },
  errorContainer: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827' },
  passwordTapArea: { marginBottom: 4 },
  passwordInputWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeButton: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  passwordHintRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 6 },
  passwordHint: { fontSize: 13, color: '#6B7280' },
  continueButton: { backgroundColor: ORANGE, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  continueButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});

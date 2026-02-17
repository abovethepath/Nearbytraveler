import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Modal, FlatList, useColorScheme, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';
import { BUSINESS_TYPES } from '../constants/businessTypes';

const ORANGE = '#F97316';
const TEAL = '#14B8A6';
const SIGNUP_DATA_KEY = 'signup_data';

const DARK = {
  bg: '#1c1c1e',
  text: '#ffffff',
  textMuted: '#8e8e93',
  inputBg: '#2c2c2e',
  inputBorder: '#38383a',
  errorBg: '#3d1f1f',
  errorBorder: '#5c2a2a',
  modalBg: '#1c1c1e',
  modalBorder: '#38383a',
};

export default function SignupStep3BusinessScreen({ navigation, route }) {
  const { setUser } = useAuth();
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const [signupData, setSignupData] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [customBusinessType, setCustomBusinessType] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('United States');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBusinessTypePicker, setShowBusinessTypePicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(SIGNUP_DATA_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSignupData(parsed);
          setContactName(parsed.name || '');
        } else {
          navigation.replace('SignupStep1');
        }
      } catch {
        navigation.replace('SignupStep1');
      }
    };
    load();
  }, []);

  const handleComplete = async () => {
    setError('');
    if (!signupData) return;

    const trimmedBusinessName = businessName.trim();
    const trimmedContactName = contactName.trim();
    const trimmedContactPhone = contactPhone.trim().replace(/[\s\-\(\)]/g, '');
    const trimmedBusinessPhone = businessPhone.trim().replace(/[\s\-\(\)]/g, '');
    const trimmedStreet = streetAddress.trim();
    const trimmedZip = zipCode.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedCountry = country.trim() || 'United States';

    if (!trimmedBusinessName) {
      setError('Business name is required.');
      return;
    }
    if (!trimmedContactName) {
      setError('Contact person name is required.');
      return;
    }
    if (!trimmedContactPhone || trimmedContactPhone.length < 7) {
      setError('Contact phone number is required and must be valid.');
      return;
    }
    const effectiveBusinessType = businessType === 'Custom (specify below)' ? customBusinessType.trim() : businessType;
    if (!effectiveBusinessType) {
      setError('Business type is required.');
      return;
    }
    if (!trimmedBusinessPhone || trimmedBusinessPhone.length < 7) {
      setError('Business phone number is required and must be valid.');
      return;
    }
    if (!trimmedStreet) {
      setError('Street address is required.');
      return;
    }
    if (!trimmedZip) {
      setError('Zip/Postal code is required.');
      return;
    }
    if (!trimmedCity || !trimmedCountry) {
      setError('City and country are required.');
      return;
    }

    const hometown = [trimmedCity, trimmedState, trimmedCountry].filter(Boolean).join(', ');
    let websiteUrl = website.trim();
    if (websiteUrl && !websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = `https://${websiteUrl}`;
    }
    const trimmedBusinessEmail = businessEmail.trim();
    const finalBusinessEmail = trimmedBusinessEmail || signupData.email;

    const registrationData = {
      userType: 'business',
      email: signupData.email,
      password: signupData.password,
      username: signupData.username,
      name: trimmedBusinessName,
      keepLoggedIn: true,
      businessName: trimmedBusinessName,
      ownerName: trimmedBusinessName,
      contactName: trimmedContactName,
      ownerPhone: contactPhone.trim(),
      businessPhone: businessPhone.trim(),
      phoneNumber: businessPhone.trim(),
      businessType: effectiveBusinessType,
      streetAddress: trimmedStreet,
      businessAddress: trimmedStreet,
      zipCode: trimmedZip,
      city: trimmedCity,
      state: trimmedState,
      country: trimmedCountry,
      hometownCity: trimmedCity,
      hometownState: trimmedState,
      hometownCountry: trimmedCountry,
      hometown,
      location: hometown,
      websiteUrl: websiteUrl || '',
      businessEmail: finalBusinessEmail,
      ownerEmail: signupData.email,
      interests: [],
      activities: [],
      languagesSpoken: ['English'],
    };

    setLoading(true);
    try {
      const result = await api.register(registrationData);
      await AsyncStorage.removeItem(SIGNUP_DATA_KEY);

      const user = result.user;
      if (user) {
        setUser?.(user);
        try {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        } catch {}
        // Trigger bootstrap (chatroom auto-join, etc.) - fire-and-forget
        api.bootstrapAfterRegister().catch(() => {});
      }
    } catch (e) {
      setError(e?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = { backgroundColor: dark ? DARK.bg : '#FFFFFF' };
  const stepLabelStyle = { color: dark ? DARK.textMuted : '#6B7280' };
  const titleStyle = { color: dark ? DARK.text : '#111827' };
  const subtitleStyle = { color: dark ? DARK.textMuted : '#6B7280' };
  const sectionTitleStyle = { color: dark ? DARK.text : '#111827' };
  const errorContainerStyle = dark ? { backgroundColor: DARK.errorBg, borderColor: DARK.errorBorder } : {};
  const inputLabelStyle = { color: dark ? DARK.text : '#374151' };
  const inputHintStyle = { color: dark ? DARK.textMuted : '#6B7280' };
  const inputStyle = dark ? { backgroundColor: DARK.inputBg, borderColor: DARK.inputBorder, color: DARK.text } : {};
  const pickerButtonStyle = dark ? { backgroundColor: DARK.inputBg, borderColor: DARK.inputBorder } : {};
  const pickerTextStyle = dark ? { color: DARK.text } : {};
  const pickerPlaceholderStyle = dark ? { color: DARK.textMuted } : {};
  const placeholderColor = dark ? '#8e8e93' : '#9CA3AF';
  const modalContentStyle = dark ? { backgroundColor: DARK.modalBg } : {};
  const modalTitleStyle = dark ? { color: DARK.text } : {};
  const modalItemStyle = dark ? { borderBottomColor: DARK.modalBorder } : {};
  const modalItemTextStyle = dark ? { color: DARK.text } : {};
  const modalCancelTextStyle = dark ? { color: DARK.textMuted } : {};

  if (!signupData) {
    return (
      <SafeAreaView style={[styles.container, containerStyle]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, containerStyle]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={[styles.stepLabel, stepLabelStyle]}>Step 3 of 3</Text>
          </View>

          <Text style={[styles.title, titleStyle]}>Register your business</Text>
          <Text style={[styles.subtitle, subtitleStyle]}>Almost there! Add your business details.</Text>

          {error ? (
            <View style={[styles.errorContainer, errorContainerStyle]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, sectionTitleStyle]}>Account contact (for admin)</Text>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Contact Person Name *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="John Smith"
              placeholderTextColor={placeholderColor}
              value={contactName}
              onChangeText={setContactName}
              autoCapitalize="words"
            />
            <Text style={[styles.inputHint, inputHintStyle]}>Person we can reach about this account</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Contact Phone *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor={placeholderColor}
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
            <Text style={[styles.inputHint, inputHintStyle]}>Direct line for account owner</Text>
          </View>

          <Text style={[styles.sectionTitle, sectionTitleStyle]}>Business information</Text>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Business Name *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="Your business name"
              placeholderTextColor={placeholderColor}
              value={businessName}
              onChangeText={setBusinessName}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Business Type *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, pickerButtonStyle]}
              onPress={() => setShowBusinessTypePicker(true)}
            >
              <Text style={businessType ? [styles.pickerText, pickerTextStyle] : [styles.pickerPlaceholder, pickerPlaceholderStyle]}>
                {businessType || 'Select business type'}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          {businessType === 'Custom (specify below)' && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, inputLabelStyle]}>Custom Business Type *</Text>
              <TextInput
                style={[styles.input, inputStyle]}
                placeholder="Enter your business type"
                placeholderTextColor={placeholderColor}
                value={customBusinessType}
                onChangeText={setCustomBusinessType}
                autoCapitalize="words"
              />
            </View>
          )}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Business Phone *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor={placeholderColor}
              value={businessPhone}
              onChangeText={setBusinessPhone}
              keyboardType="phone-pad"
            />
            <Text style={[styles.inputHint, inputHintStyle]}>Public phone customers will call</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Business Email (optional)</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="contact@yourbusiness.com"
              placeholderTextColor={placeholderColor}
              value={businessEmail}
              onChangeText={setBusinessEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={[styles.inputHint, inputHintStyle]}>Leave blank to use your account email for inquiries</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Website (optional)</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="www.yourbusiness.com"
              placeholderTextColor={placeholderColor}
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <Text style={[styles.sectionTitle, sectionTitleStyle]}>Business location</Text>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Street Address *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="123 Main Street"
              placeholderTextColor={placeholderColor}
              value={streetAddress}
              onChangeText={setStreetAddress}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Zip/Postal Code *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="90210"
              placeholderTextColor={placeholderColor}
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>City *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="Los Angeles"
              placeholderTextColor={placeholderColor}
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>State/Province</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="California"
              placeholderTextColor={placeholderColor}
              value={state}
              onChangeText={setState}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Country *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="United States"
              placeholderTextColor={placeholderColor}
              value={country}
              onChangeText={setCountry}
              autoCapitalize="words"
            />
          </View>

          <View style={{ marginTop: 16, marginBottom: 8, alignItems: 'center' }}>
            <Text style={[styles.subtitle, { color: dark ? DARK.textMuted : '#6B7280', textAlign: 'center', fontSize: 13 }]}>
              By completing your profile, you agree to our{' '}
              <Text
                style={{ color: '#3B82F6', fontWeight: '600' }}
                onPress={() => Linking.openURL('https://nearbytraveler.org/terms')}
              >
                Terms and Conditions
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, loading && { opacity: 0.7 }]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Register Business</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showBusinessTypePicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBusinessTypePicker(false)}
        >
          <View style={[styles.modalContent, modalContentStyle]}>
            <Text style={[styles.modalTitle, modalTitleStyle]}>Select business type</Text>
            <FlatList
              data={BUSINESS_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, modalItemStyle]}
                  onPress={() => {
                    setBusinessType(item);
                    setShowBusinessTypePicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, modalItemTextStyle]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowBusinessTypePicker(false)}
            >
              <Text style={[styles.modalCancelText, modalCancelTextStyle]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 48 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { paddingVertical: 8, paddingRight: 16 },
  backText: { color: TEAL, fontSize: 17, fontWeight: '600' },
  stepLabel: { flex: 1, textAlign: 'right', color: '#6B7280', fontSize: 14 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 12 },
  errorContainer: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputHint: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827' },
  pickerButton: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerText: { fontSize: 16, color: '#111827' },
  pickerPlaceholder: { fontSize: 16, color: '#9CA3AF' },
  pickerArrow: { fontSize: 12, color: '#6B7280' },
  continueButton: { backgroundColor: TEAL, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  continueButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%', paddingBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', padding: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalItemText: { fontSize: 16, color: '#111827' },
  modalCancel: { padding: 16, alignItems: 'center' },
  modalCancelText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
});

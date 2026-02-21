import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, useColorScheme,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';
import { BASE_URL } from '../config';
import { SIGNUP_INTERESTS } from '../constants/interests';
import LocationPicker from '../components/LocationPicker';

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
  chipBg: '#2c2c2e',
  chipBorder: '#38383a',
  newToTownBg: '#1e3a5f',
  newToTownBorder: '#2563eb',
};

export default function SignupStep3Screen({ navigation, route }) {
  const { userType } = route?.params || {};
  const { setUser } = useAuth();
  const [signupData, setSignupData] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hometownCity, setHometownCity] = useState('');
  const [hometownState, setHometownState] = useState('');
  const [hometownCountry, setHometownCountry] = useState('United States');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationState, setDestinationState] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [travelReturnDate, setTravelReturnDate] = useState(null);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [interests, setInterests] = useState([]);
  const [customInterestsText, setCustomInterestsText] = useState('');
  const [isNewToTown, setIsNewToTown] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const effectiveUserType = userType || signupData?.userType || 'local';
  const isTraveler = effectiveUserType === 'traveler';
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(SIGNUP_DATA_KEY);
        if (stored) setSignupData(JSON.parse(stored));
        else navigation.replace('SignupStep1');
      } catch {
        navigation.replace('SignupStep1');
      }
    };
    load();
  }, []);

  const toggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleComplete = async () => {
    setError('');
    if (!signupData) {
      setError('Session expired. Please start signup again.');
      return;
    }

    const city = hometownCity.trim();
    const country = hometownCountry.trim() || 'United States';

    if (!dateOfBirth) {
      setError('Please select your date of birth.');
      setTimeout(() => scrollRef.current?.scrollTo?.({ y: 0, animated: true }), 100);
      return;
    }
    if (!city || !country) {
      setError('Hometown city and country are required.');
      setTimeout(() => scrollRef.current?.scrollTo?.({ y: 0, animated: true }), 100);
      return;
    }
    const customList = customInterestsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const totalInterests = interests.length + customList.length;
    if (totalInterests < 7) {
      setError('Please choose at least 7 interests (from the list and/or add your own).');
      setTimeout(() => scrollRef.current?.scrollTo?.({ y: 0, animated: true }), 100);
      return;
    }

    if (isTraveler) {
      const destCity = destinationCity.trim();
      const destCountry = destinationCountry.trim();
      if (!destCity || !destCountry) {
        setError('Current destination city and country are required.');
        return;
      }
      if (!travelReturnDate) {
        setError('When does your trip end? (required)');
        return;
      }
      const returnDate = travelReturnDate instanceof Date ? travelReturnDate : new Date(travelReturnDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      returnDate.setHours(0, 0, 0, 0);
      if (returnDate < today) {
        setError('Trip end date must be today or in the future.');
        return;
      }
    }

    const hometown = [city, hometownState.trim(), country].filter(Boolean).join(', ');
    const destination = isTraveler
      ? [destinationCity.trim(), destinationState.trim(), destinationCountry.trim()].filter(Boolean).join(', ')
      : '';

    const registrationData = {
      userType: effectiveUserType,
      isCurrentlyTraveling: isTraveler,
      isNewToTown: isNewToTown,
      email: signupData.email,
      password: signupData.password,
      username: signupData.username,
      name: signupData.name,
      phoneNumber: '',
      keepLoggedIn: true,
      dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : '',
      hometownCity: city,
      hometownState: hometownState.trim() || '',
      hometownCountry: country,
      hometown,
      location: hometown,
      interests,
      activities: [],
      events: [],
      customInterests: customInterestsText.trim(),
      languagesSpoken: ['English'],
    };

    if (isTraveler) {
      registrationData.destinationCity = destinationCity.trim();
      registrationData.destinationState = destinationState.trim() || '';
      registrationData.destinationCountry = destinationCountry.trim();
      registrationData.travelDestination = destination;
      registrationData.travelReturnDate = travelReturnDate ? travelReturnDate.toISOString().split('T')[0] : '';
    }

    setLoading(true);
    try {
      const result = await api.register(registrationData);
      await AsyncStorage.removeItem(SIGNUP_DATA_KEY);

      let user = result.user;
      if (!user && (result.sessionId || result.ok !== false)) {
        try {
          user = await api.getUser();
        } catch {}
      }
      if (user) {
        setUser?.(user);
        try {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        } catch {}
        // Trigger bootstrap (chatroom auto-join, etc.) - fire-and-forget
        api.bootstrapAfterRegister().catch(() => {});
      } else {
        setError('Account created but we couldn’t load your profile. Try logging in.');
      }
    } catch (e) {
      setError(e?.message || 'Registration failed. Please try again.');
      setTimeout(() => scrollRef.current?.scrollTo?.({ y: 0, animated: true }), 100);
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
  const inputStyle = dark ? { backgroundColor: DARK.inputBg, borderColor: DARK.inputBorder, color: DARK.text } : {};
  const dateTextColor = dark ? DARK.text : '#111827';
  const placeholderColor = dark ? DARK.textMuted : '#9CA3AF';
  const datePickerBg = dark ? DARK.inputBg : '#F9FAFB';
  const datePickerText = dark ? DARK.text : '#111827';
  const newToTownBoxStyle = dark ? { backgroundColor: DARK.newToTownBg, borderColor: DARK.newToTownBorder } : { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' };
  const interestsTitleStyle = { color: dark ? DARK.text : '#374151' };
  const interestsSubtitleStyle = { color: dark ? DARK.textMuted : '#6B7280' };
  const interestChipBase = dark ? { backgroundColor: DARK.chipBg, borderColor: DARK.chipBorder } : {};
  const interestChipTextBase = dark ? { color: DARK.text } : {};

  if (!signupData) {
    return (
      <SafeAreaView style={[styles.container, containerStyle]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, containerStyle]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={[styles.stepLabel, stepLabelStyle]}>Step 3 of 3</Text>
          </View>

          <Text style={[styles.title, titleStyle]}>Complete your profile</Text>
          <Text style={[styles.subtitle, subtitleStyle]}>Almost there! Add a few more details.</Text>

          {error ? (
            <View style={[styles.errorContainer, errorContainerStyle]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Date of Birth *</Text>
            <TouchableOpacity
              style={[styles.input, inputStyle]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: dateOfBirth ? dateTextColor : placeholderColor, fontSize: 16 }}>
                {dateOfBirth ? dateOfBirth.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Tap to select your birth date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <View style={{ backgroundColor: datePickerBg, borderRadius: 12, padding: 8 }}>
                <DateTimePicker
                  value={dateOfBirth || new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  themeVariant={dark ? 'dark' : 'light'}
                  textColor={datePickerText}
                  onChange={(evt, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDateOfBirth(selectedDate);
                    }
                  }}
                  maximumDate={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d; })()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              </View>
            )}
          </View>
          <LocationPicker
            label="Hometown *"
            country={hometownCountry}
            state={hometownState}
            city={hometownCity}
            onLocationChange={({ country, state, city }) => {
              setHometownCountry(country);
              setHometownState(state);
              setHometownCity(city);
            }}
            required
            dark={dark}
          />

          <TouchableOpacity
            style={[styles.inputContainer, { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 }, newToTownBoxStyle]}
            onPress={() => setIsNewToTown(!isNewToTown)}
            activeOpacity={0.7}
          >
            <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: isNewToTown ? ORANGE : '#9CA3AF', backgroundColor: isNewToTown ? ORANGE : 'transparent', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
              {isNewToTown ? <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>✓</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, inputLabelStyle, { marginBottom: 4 }]}>Are you new to your hometown?</Text>
              <Text style={{ fontSize: 13, color: dark ? DARK.textMuted : '#6B7280' }}>I'm new to {hometownCity || 'my hometown'} – connect me with locals who can help me explore</Text>
            </View>
          </TouchableOpacity>

          {isTraveler ? (
            <>
              <Text style={styles.sectionTitle}>✈️ Current trip</Text>
              <LocationPicker
                label="Destination"
                country={destinationCountry}
                state={destinationState}
                city={destinationCity}
                onLocationChange={({ country, state, city }) => {
                  setDestinationCountry(country);
                  setDestinationState(state);
                  setDestinationCity(city);
                }}
                required
                dark={dark}
              />
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, inputLabelStyle]}>When does your trip end? *</Text>
                <TouchableOpacity
                  style={[styles.input, inputStyle]}
                  onPress={() => setShowReturnDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: travelReturnDate ? dateTextColor : placeholderColor, fontSize: 16 }}>
                    {travelReturnDate ? travelReturnDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Tap to select trip end date'}
                  </Text>
                </TouchableOpacity>
                {showReturnDatePicker && (
                  <View style={{ backgroundColor: datePickerBg, borderRadius: 12, padding: 8, marginTop: 8 }}>
                    <DateTimePicker
                      value={travelReturnDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      themeVariant={dark ? 'dark' : 'light'}
                      textColor={datePickerText}
                      onChange={(evt, selectedDate) => {
                        if (Platform.OS !== 'ios') setShowReturnDatePicker(false);
                        if (selectedDate) setTravelReturnDate(selectedDate);
                      }}
                      minimumDate={new Date()}
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={{ backgroundColor: ORANGE, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 }}
                        onPress={() => setShowReturnDatePicker(false)}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>Done</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </>
          ) : null}

          <Text style={[styles.interestsTitle, interestsTitleStyle]}>Interests * (minimum 7)</Text>
          <Text style={[styles.interestsSubtitle, interestsSubtitleStyle]}>
            We match you with others based on common interests—choose as many as apply to you.
          </Text>
          <Text style={[styles.interestsSubtitle, interestsSubtitleStyle, { marginBottom: 8 }]}>
            Selected: {interests.length + customInterestsText.split(',').map((s) => s.trim()).filter(Boolean).length}
          </Text>
          <View style={styles.interestsGrid}>
            {SIGNUP_INTERESTS.map((item) => {
              const isSelected = interests.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.interestChip, interestChipBase, isSelected && styles.interestChipSelected]}
                  onPress={() => toggleInterest(item)}
                >
                  <Text style={[styles.interestChipText, interestChipTextBase, isSelected && styles.interestChipTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.inputContainer, { marginTop: 8 }]}>
            <Text style={[styles.inputLabel, inputLabelStyle]}>Add your own (comma-separated)</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="e.g. Surfing, Jazz clubs, Food tours"
              placeholderTextColor={placeholderColor}
              value={customInterestsText}
              onChangeText={setCustomInterestsText}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={{ marginTop: 16, marginBottom: 8, alignItems: 'center' }}>
            <Text style={[styles.interestsSubtitle, interestsSubtitleStyle, { textAlign: 'center' }]}>
              By completing your profile, you agree to our{' '}
              <Text
                style={{ color: '#3B82F6', fontWeight: '600' }}
                onPress={() => navigation.navigate('TermsWebView', { url: `${BASE_URL}/terms`, title: 'Terms and Conditions' })}
              >
                Terms and Conditions
              </Text>
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.continueButton, loading && { opacity: 0.7 }, pressed && { opacity: 0.85 }]}
            onPress={handleComplete}
            disabled={loading}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Create Account</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backText: { color: ORANGE, fontSize: 17, fontWeight: '600' },
  stepLabel: { flex: 1, textAlign: 'right', color: '#6B7280', fontSize: 14 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 12 },
  errorContainer: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827' },
  interestsTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 4 },
  interestsSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  interestChipSelected: { backgroundColor: ORANGE, borderColor: ORANGE },
  interestChipText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  interestChipTextSelected: { color: '#FFFFFF' },
  continueButton: { backgroundColor: ORANGE, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  continueButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});

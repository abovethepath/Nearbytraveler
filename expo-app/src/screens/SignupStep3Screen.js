import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';
import { SIGNUP_INTERESTS } from '../constants/interests';

const ORANGE = '#F97316';
const SIGNUP_DATA_KEY = 'signup_data';

export default function SignupStep3Screen({ navigation, route }) {
  const { userType } = route?.params || {};
  const { setUser } = useAuth();
  const [signupData, setSignupData] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [hometownCity, setHometownCity] = useState('');
  const [hometownState, setHometownState] = useState('');
  const [hometownCountry, setHometownCountry] = useState('United States');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationState, setDestinationState] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [travelReturnDate, setTravelReturnDate] = useState('');
  const [interests, setInterests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const effectiveUserType = userType || signupData?.userType || 'local';
  const isTraveler = effectiveUserType === 'traveler';

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
    if (!signupData) return;

    const city = hometownCity.trim();
    const country = hometownCountry.trim() || 'United States';

    if (!dateOfBirth) {
      setError('Date of birth is required.');
      return;
    }
    if (!city || !country) {
      setError('Hometown city and country are required.');
      return;
    }
    if (interests.length < 7) {
      setError('Please choose at least 7 interests.');
      return;
    }

    if (isTraveler) {
      const destCity = destinationCity.trim();
      const destCountry = destinationCountry.trim();
      if (!destCity || !destCountry) {
        setError('Current destination city and country are required.');
        return;
      }
      if (!travelReturnDate.trim()) {
        setError('When does your trip end? (required)');
        return;
      }
      const returnDate = new Date(travelReturnDate);
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
      isNewToTown: false,
      email: signupData.email,
      password: signupData.password,
      username: signupData.username,
      name: signupData.name,
      phoneNumber: '',
      keepLoggedIn: true,
      dateOfBirth,
      hometownCity: city,
      hometownState: hometownState.trim() || '',
      hometownCountry: country,
      hometown,
      location: hometown,
      interests,
      activities: [],
      events: [],
      customInterests: '',
      languagesSpoken: ['English'],
    };

    if (isTraveler) {
      registrationData.destinationCity = destinationCity.trim();
      registrationData.destinationState = destinationState.trim() || '';
      registrationData.destinationCountry = destinationCountry.trim();
      registrationData.travelDestination = destination;
      registrationData.travelReturnDate = travelReturnDate.trim();
    }

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
      // AuthContext will re-render and show MainTabs when user is set
    } catch (e) {
      setError(e?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!signupData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.stepLabel}>Step 3 of 3</Text>
          </View>

          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>Almost there! Add a few more details.</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date of Birth *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Hometown City *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Los Angeles"
              placeholderTextColor="#9CA3AF"
              value={hometownCity}
              onChangeText={setHometownCity}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>State / Region</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. California"
              placeholderTextColor="#9CA3AF"
              value={hometownState}
              onChangeText={setHometownState}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Country *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. United States"
              placeholderTextColor="#9CA3AF"
              value={hometownCountry}
              onChangeText={setHometownCountry}
              autoCapitalize="words"
            />
          </View>

          {isTraveler ? (
            <>
              <Text style={styles.sectionTitle}>✈️ Current trip</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Destination City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Where are you traveling?"
                  placeholderTextColor="#9CA3AF"
                  value={destinationCity}
                  onChangeText={setDestinationCity}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>State / Region</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. California"
                  placeholderTextColor="#9CA3AF"
                  value={destinationState}
                  onChangeText={setDestinationState}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Country *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. United States"
                  placeholderTextColor="#9CA3AF"
                  value={destinationCountry}
                  onChangeText={setDestinationCountry}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>When does your trip end? *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={travelReturnDate}
                  onChangeText={setTravelReturnDate}
                />
              </View>
            </>
          ) : null}

          <Text style={styles.interestsTitle}>Interests * (choose at least 7)</Text>
          <Text style={styles.interestsSubtitle}>Selected: {interests.length}</Text>
          <View style={styles.interestsGrid}>
            {SIGNUP_INTERESTS.map((item) => {
              const isSelected = interests.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                  onPress={() => toggleInterest(item)}
                >
                  <Text style={[styles.interestChipText, isSelected && styles.interestChipTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.continueButton, loading && { opacity: 0.7 }]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Create Account</Text>
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

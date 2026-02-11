import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Alert, Dimensions,
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';
import { TOP_CHOICES, BUSINESS_TYPES } from '../constants/options';

const { width } = Dimensions.get('window');
const INTEREST_MIN = 7;

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    fullName: '',
    city: '',
    state: '',
    country: '',
    destinationCity: '',
    destinationState: '',
    destinationCountry: '',
    travelReturnDate: '',
    businessName: '',
    businessType: '',
    streetAddress: '',
    zipCode: '',
    interests: [],
    customInterests: '',
    pledgeAccepted: false,
  });

  const [usernameStatus, setUsernameStatus] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [step]);

  const checkUsername = async (username) => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const result = await api.checkUsername(username);
      setUsernameStatus(result.available ? 'available' : 'taken');
    } catch (e) {
      setUsernameStatus(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'username') {
      setUsernameStatus(null);
      if (value.length >= 3) {
        const timer = setTimeout(() => checkUsername(value), 500);
        return () => clearTimeout(timer);
      }
    }
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const getCustomCount = () => {
    if (!formData.customInterests.trim()) return 0;
    return formData.customInterests.split(',').filter(i => i.trim()).length;
  };

  const getTotalInterests = () => formData.interests.length + getCustomCount();

  const validateStep2 = () => {
    if (!formData.username.trim()) return 'Username is required';
    if (formData.username.trim().length < 3) return 'Username must be at least 3 characters';
    if (usernameStatus === 'taken') return 'Username is already taken';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@')) return 'Please enter a valid email';
    if (!formData.password || formData.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const validateStep3 = () => {
    if (!formData.city.trim()) return 'Hometown city is required';
    if (!formData.country.trim()) return 'Country is required';
    if (userType === 'traveler') {
      if (!formData.destinationCity.trim()) return 'Destination city is required';
      if (!formData.travelReturnDate) return 'Trip end date is required';
    }
    if (userType === 'business') {
      if (!formData.businessName.trim()) return 'Business name is required';
      if (!formData.businessType) return 'Business type is required';
      if (!formData.streetAddress.trim()) return 'Street address is required';
    }
    if ((userType === 'local' || userType === 'traveler') && getTotalInterests() < INTEREST_MIN) {
      return `Please select at least ${INTEREST_MIN} interests (${getTotalInterests()} selected)`;
    }
    if (!formData.pledgeAccepted) return 'Please accept the community pledge';
    return null;
  };

  const handleNext = () => {
    setError('');
    if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setError('');
    const err = validateStep3();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        fullName: formData.fullName.trim() || undefined,
        userType,
        city: formData.city.trim(),
        state: formData.state.trim() || undefined,
        country: formData.country.trim(),
        interests: formData.interests,
        customInterests: formData.customInterests.trim() || undefined,
        pledgeAccepted: formData.pledgeAccepted,
      };

      if (userType === 'traveler') {
        payload.destinationCity = formData.destinationCity.trim();
        payload.destinationState = formData.destinationState.trim() || undefined;
        payload.destinationCountry = formData.destinationCountry.trim() || undefined;
        payload.travelReturnDate = formData.travelReturnDate;
      }

      if (userType === 'business') {
        payload.businessName = formData.businessName.trim();
        payload.businessType = formData.businessType;
        payload.streetAddress = formData.streetAddress.trim();
        payload.zipCode = formData.zipCode.trim() || undefined;
      }

      await register(payload);
    } catch (e) {
      setError(e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <Text style={styles.logoEmoji}>{'\u{1F30D}'}</Text>
        <Text style={styles.stepTitle}>Join Nearby Traveler</Text>
        <Text style={styles.stepSubtitle}>How would you like to connect?</Text>
      </View>

      <TouchableOpacity
        style={[styles.typeCard, userType === 'local' && styles.typeCardSelected]}
        onPress={() => { setUserType('local'); setStep(2); }}
        activeOpacity={0.7}
      >
        <View style={styles.typeCardIcon}>
          <Text style={styles.typeEmoji}>{'\u{1F3E0}'}</Text>
        </View>
        <View style={styles.typeCardContent}>
          <Text style={styles.typeCardTitle}>I'm a Local</Text>
          <Text style={styles.typeCardDesc}>Meet travelers visiting my city and share my local knowledge</Text>
        </View>
        <Text style={styles.typeArrow}>{'\u203A'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.typeCard, userType === 'traveler' && styles.typeCardSelected]}
        onPress={() => { setUserType('traveler'); setStep(2); }}
        activeOpacity={0.7}
      >
        <View style={styles.typeCardIcon}>
          <Text style={styles.typeEmoji}>{'\u2708\uFE0F'}</Text>
        </View>
        <View style={styles.typeCardContent}>
          <Text style={styles.typeCardTitle}>I'm Traveling</Text>
          <Text style={styles.typeCardDesc}>Connect with locals and fellow travelers at my destination</Text>
        </View>
        <Text style={styles.typeArrow}>{'\u203A'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.typeCard, userType === 'business' && styles.typeCardSelected]}
        onPress={() => { setUserType('business'); setStep(2); }}
        activeOpacity={0.7}
      >
        <View style={styles.typeCardIcon}>
          <Text style={styles.typeEmoji}>{'\u{1F3EA}'}</Text>
        </View>
        <View style={styles.typeCardContent}>
          <Text style={styles.typeCardTitle}>I'm a Business</Text>
          <Text style={styles.typeCardDesc}>Attract travelers and locals to your business</Text>
        </View>
        <Text style={styles.typeArrow}>{'\u203A'}</Text>
      </TouchableOpacity>

      <View style={styles.loginPrompt}>
        <Text style={styles.loginPromptText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step 1 of 2</Text>
        </View>
        <Text style={styles.stepTitle}>Create Your Account</Text>
        <Text style={styles.stepSubtitle}>
          {userType === 'local' ? 'Welcome, neighbor!' : userType === 'traveler' ? 'Welcome, adventurer!' : 'Welcome, business owner!'}
        </Text>
      </View>

      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#9CA3AF"
          value={formData.fullName}
          onChangeText={(v) => updateField('fullName', v)}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Username *</Text>
        <View style={styles.inputWithStatus}>
          <TextInput
            style={[styles.input, styles.inputFlex]}
            placeholder="Choose a unique username"
            placeholderTextColor="#9CA3AF"
            value={formData.username}
            onChangeText={(v) => updateField('username', v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={() => checkUsername(formData.username)}
          />
          {checkingUsername && <ActivityIndicator size="small" color="#F97316" style={styles.inputStatus} />}
          {!checkingUsername && usernameStatus === 'available' && (
            <Text style={[styles.inputStatus, styles.statusAvailable]}>{'\u2713'}</Text>
          )}
          {!checkingUsername && usernameStatus === 'taken' && (
            <Text style={[styles.inputStatus, styles.statusTaken]}>{'\u2717'}</Text>
          )}
        </View>
        {usernameStatus === 'taken' && (
          <Text style={styles.fieldError}>This username is already taken</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor="#9CA3AF"
          value={formData.email}
          onChangeText={(v) => updateField('email', v)}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="At least 6 characters"
          placeholderTextColor="#9CA3AF"
          value={formData.password}
          onChangeText={(v) => updateField('password', v)}
          secureTextEntry
          textContentType="newPassword"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+1 (555) 123-4567"
          placeholderTextColor="#9CA3AF"
          value={formData.phone}
          onChangeText={(v) => updateField('phone', v)}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
        />
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step 2 of 2</Text>
        </View>
        <Text style={styles.stepTitle}>Complete Your Profile</Text>
      </View>

      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{'\u{1F3E0}'} Your Hometown</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>City *</Text>
          <TextInput style={styles.input} placeholder="e.g. Los Angeles" placeholderTextColor="#9CA3AF"
            value={formData.city} onChangeText={(v) => updateField('city', v)} autoCapitalize="words" />
        </View>
        <View style={styles.rowInputs}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>State/Region</Text>
            <TextInput style={styles.input} placeholder="e.g. California" placeholderTextColor="#9CA3AF"
              value={formData.state} onChangeText={(v) => updateField('state', v)} autoCapitalize="words" />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Country *</Text>
            <TextInput style={styles.input} placeholder="e.g. United States" placeholderTextColor="#9CA3AF"
              value={formData.country} onChangeText={(v) => updateField('country', v)} autoCapitalize="words" />
          </View>
        </View>
      </View>

      {userType === 'traveler' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{'\u2708\uFE0F'} Your Destination</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destination City *</Text>
            <TextInput style={styles.input} placeholder="Where are you traveling?" placeholderTextColor="#9CA3AF"
              value={formData.destinationCity} onChangeText={(v) => updateField('destinationCity', v)} autoCapitalize="words" />
          </View>
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>State/Region</Text>
              <TextInput style={styles.input} placeholder="State/Region" placeholderTextColor="#9CA3AF"
                value={formData.destinationState} onChangeText={(v) => updateField('destinationState', v)} autoCapitalize="words" />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Country</Text>
              <TextInput style={styles.input} placeholder="Country" placeholderTextColor="#9CA3AF"
                value={formData.destinationCountry} onChangeText={(v) => updateField('destinationCountry', v)} autoCapitalize="words" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trip End Date *</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF"
              value={formData.travelReturnDate} onChangeText={(v) => updateField('travelReturnDate', v)} />
          </View>
        </View>
      )}

      {userType === 'business' && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{'\u{1F3EA}'} Business Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput style={styles.input} placeholder="Your business name" placeholderTextColor="#9CA3AF"
              value={formData.businessName} onChangeText={(v) => updateField('businessName', v)} autoCapitalize="words" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {BUSINESS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, formData.businessType === type && styles.typeChipSelected]}
                  onPress={() => updateField('businessType', type)}
                >
                  <Text style={[styles.typeChipText, formData.businessType === type && styles.typeChipTextSelected]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput style={styles.input} placeholder="123 Main Street" placeholderTextColor="#9CA3AF"
              value={formData.streetAddress} onChangeText={(v) => updateField('streetAddress', v)} autoCapitalize="words" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Zip/Postal Code</Text>
            <TextInput style={styles.input} placeholder="90210" placeholderTextColor="#9CA3AF"
              value={formData.zipCode} onChangeText={(v) => updateField('zipCode', v)} keyboardType="number-pad" />
          </View>
        </View>
      )}

      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{'\u2B50'} Your Interests</Text>
          {(userType === 'local' || userType === 'traveler') && (
            <View style={[styles.countBadge, getTotalInterests() >= INTEREST_MIN ? styles.countBadgeGood : styles.countBadgeNeed]}>
              <Text style={styles.countBadgeText}>{getTotalInterests()}/{INTEREST_MIN}</Text>
            </View>
          )}
        </View>
        {(userType === 'local' || userType === 'traveler') && (
          <Text style={styles.sectionHint}>Select at least {INTEREST_MIN} interests to help us match you</Text>
        )}
        {userType === 'business' && (
          <Text style={styles.sectionHint}>Select interests your business serves (optional)</Text>
        )}
        <View style={styles.interestGrid}>
          {TOP_CHOICES.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[styles.interestChip, formData.interests.includes(interest) && styles.interestChipSelected]}
              onPress={() => toggleInterest(interest)}
              activeOpacity={0.7}
            >
              <Text style={[styles.interestChipText, formData.interests.includes(interest) && styles.interestChipTextSelected]}>
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{'\u2728'} Add Your Own (Optional)</Text>
          <TextInput style={styles.input} placeholder="e.g., Rock Climbing, Board Games"
            placeholderTextColor="#9CA3AF" value={formData.customInterests}
            onChangeText={(v) => updateField('customInterests', v)} />
          <Text style={styles.fieldHint}>Separate multiple interests with commas</Text>
        </View>
      </View>

      <View style={styles.pledgeCard}>
        <Text style={styles.pledgeEmoji}>{'\u{1F30D}'}</Text>
        <Text style={styles.pledgeTitle}>The NearbyTraveler Pledge</Text>
        <Text style={styles.pledgeItem}>{'\u2713'} I believe in real human connection.</Text>
        <Text style={styles.pledgeItem}>{'\u2713'} I will show up with kindness, respect, and openness.</Text>
        <Text style={styles.pledgeItem}>{'\u2713'} I will help make this a safe, welcoming community.</Text>
        <TouchableOpacity
          style={styles.pledgeCheck}
          onPress={() => updateField('pledgeAccepted', !formData.pledgeAccepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, formData.pledgeAccepted && styles.checkboxChecked]}>
            {formData.pledgeAccepted && <Text style={styles.checkmark}>{'\u2713'}</Text>}
          </View>
          <Text style={styles.pledgeCheckText}>I agree to the NearbyTraveler Pledge</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (loading || ((userType === 'local' || userType === 'traveler') && getTotalInterests() < INTEREST_MIN) || !formData.pledgeAccepted) && styles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={loading || ((userType === 'local' || userType === 'traveler') && getTotalInterests() < INTEREST_MIN) || !formData.pledgeAccepted}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {(userType === 'local' || userType === 'traveler') && getTotalInterests() < INTEREST_MIN
              ? `Select ${INTEREST_MIN - getTotalInterests()} more interests`
              : !formData.pledgeAccepted
                ? 'Accept the pledge to continue'
                : 'Complete Signup'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {step > 1 && (
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => { setError(''); setStep(step - 1); }} style={styles.backBtn}>
              <Text style={styles.backBtnText}>{'\u2039'} Back</Text>
            </TouchableOpacity>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: step === 2 ? '50%' : '100%' }]} />
            </View>
          </View>
        )}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  topNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { paddingVertical: 4 },
  backBtnText: { color: '#F97316', fontSize: 17, fontWeight: '600' },
  progressBar: { flex: 1, height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F97316', borderRadius: 2 },
  stepContainer: { paddingTop: 20 },
  headerSection: { alignItems: 'center', marginBottom: 28 },
  logoEmoji: { fontSize: 48, marginBottom: 12 },
  stepBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
  stepBadgeText: { color: '#F97316', fontSize: 13, fontWeight: '600' },
  stepTitle: { fontSize: 26, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 6 },
  stepSubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  typeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 2, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  typeCardSelected: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  typeCardIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  typeEmoji: { fontSize: 26 },
  typeCardContent: { flex: 1 },
  typeCardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 3 },
  typeCardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  typeArrow: { fontSize: 28, color: '#D1D5DB', fontWeight: '300' },
  loginPrompt: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 28 },
  loginPromptText: { color: '#6B7280', fontSize: 15 },
  loginLink: { color: '#F97316', fontSize: 15, fontWeight: '700' },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827' },
  inputWithStatus: { flexDirection: 'row', alignItems: 'center' },
  inputFlex: { flex: 1 },
  inputStatus: { position: 'absolute', right: 14, fontSize: 18, fontWeight: '700' },
  statusAvailable: { color: '#059669' },
  statusTaken: { color: '#DC2626' },
  fieldError: { color: '#DC2626', fontSize: 12, marginTop: 4 },
  fieldHint: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  nextButton: { backgroundColor: '#F97316', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
  nextButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  sectionCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionHint: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1, marginBottom: 18 },
  typeScroll: { marginBottom: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB', marginRight: 8 },
  typeChipSelected: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  typeChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  typeChipTextSelected: { color: '#F97316', fontWeight: '600' },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  interestChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB' },
  interestChipSelected: { backgroundColor: '#F97316', borderColor: '#F97316' },
  interestChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  interestChipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  countBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  countBadgeGood: { backgroundColor: '#059669' },
  countBadgeNeed: { backgroundColor: '#F97316' },
  countBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pledgeCard: { backgroundColor: '#FFF7ED', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: '#FDBA74', alignItems: 'center' },
  pledgeEmoji: { fontSize: 36, marginBottom: 10 },
  pledgeTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 14 },
  pledgeItem: { fontSize: 14, color: '#4B5563', marginBottom: 6, alignSelf: 'flex-start' },
  pledgeCheck: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignSelf: 'stretch' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#F97316', borderColor: '#F97316' },
  checkmark: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  pledgeCheckText: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  submitButton: { backgroundColor: '#F97316', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 4, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
  submitButtonDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  submitButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});

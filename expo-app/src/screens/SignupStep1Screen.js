import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView,
} from 'react-native';

const ORANGE = '#F97316';
const BLUE = '#3B82F6';
const TEAL = '#14B8A6';

const USER_TYPES = [
  { type: 'local', icon: '📍', title: 'Nearby Local', subtitle: "I live here & want to meet travelers", color: BLUE },
  { type: 'traveler', icon: '✈️', title: 'Nearby Traveler', subtitle: "I'm traveling & want to connect", color: ORANGE },
  { type: 'business', icon: '🏪', title: 'Nearby Business', subtitle: 'I run a local business', color: TEAL },
];

export default function SignupStep1Screen({ navigation }) {
  const [userType, setUserType] = useState('');

  const handleContinue = () => {
    if (!userType) return;
    navigation.navigate('SignupStep2', { userType });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.stepLabel}>Step 1 of 3</Text>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.logoIcon}>🌍</Text>
          <Text style={styles.title}>Join Nearby Traveler</Text>
          <Text style={styles.subtitle}>Choose how you want to connect</Text>
        </View>

        <View style={styles.optionsSection}>
          {USER_TYPES.map(({ type, icon, title, subtitle, color }) => {
            const isSelected = userType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.optionCard, isSelected && { backgroundColor: color, borderColor: color }]}
                onPress={() => setUserType(type)}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                  <Text style={styles.optionIconText}>{icon}</Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>{title}</Text>
                  <Text style={[styles.optionSubtitle, isSelected && styles.optionSubtitleSelected]}>{subtitle}</Text>
                </View>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, !userType && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!userType}
        >
          <Text style={styles.continueButtonText}>
            {userType ? 'Continue →' : 'Select an option to continue'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { paddingVertical: 8, paddingRight: 16 },
  backText: { color: ORANGE, fontSize: 17, fontWeight: '600' },
  stepLabel: { flex: 1, textAlign: 'right', color: '#6B7280', fontSize: 14 },
  titleSection: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  optionsSection: { gap: 12, marginBottom: 32 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionIconSelected: { backgroundColor: 'rgba(255,255,255,0.3)' },
  optionIconText: { fontSize: 24 },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  optionTitleSelected: { color: '#FFFFFF' },
  optionSubtitle: { fontSize: 14, color: '#6B7280' },
  optionSubtitleSelected: { color: 'rgba(255,255,255,0.9)' },
  checkmark: { fontSize: 20, color: '#FFFFFF', fontWeight: '700' },
  continueButton: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: { backgroundColor: '#E5E7EB' },
  continueButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});

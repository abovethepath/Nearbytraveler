import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ORANGE = '#F97316';
const BLUE = '#3B82F6';
const BLUE_600 = '#2563EB';

const DARK = {
  bg: '#1c1c1e',
  text: '#ffffff',
  textMuted: '#8e8e93',
  cardBg: '#2c2c2e',
  cardBorder: '#38383a',
  iconBg: '#38383a',
  disabledBg: '#38383a',
};

// Match web join-now-widget-new.tsx: Local=blue-orange, Traveler=blue, Business=orange
const USER_TYPES = [
  { type: 'local', icon: '📍', title: 'Nearby Local', subtitle: "I live here & want to meet travelers", colors: [BLUE, ORANGE] },
  { type: 'traveler', icon: '✈️', title: 'Nearby Traveler', subtitle: "I'm traveling & want to connect", colors: [BLUE, BLUE_600] },
  { type: 'business', icon: '🏪', title: 'Nearby Business', subtitle: 'I run a local business', colors: [ORANGE, '#EA580C'] },
];

export default function SignupStep1Screen({ navigation }) {
  const [userType, setUserType] = useState('');
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';

  const handleContinue = () => {
    if (!userType) return;
    navigation.navigate('SignupStep2', { userType });
  };

  const containerStyle = { backgroundColor: dark ? DARK.bg : '#FFFFFF' };
  const stepLabelStyle = { color: dark ? DARK.textMuted : '#6B7280' };
  const titleStyle = { color: dark ? DARK.text : '#111827' };
  const subtitleStyle = { color: dark ? DARK.textMuted : '#6B7280' };
  const optionCardBase = dark ? { backgroundColor: DARK.cardBg, borderColor: DARK.cardBorder } : {};
  const optionIconBase = dark ? { backgroundColor: DARK.iconBg } : {};
  const optionTitleBase = dark ? { color: DARK.text } : {};
  const optionSubtitleBase = dark ? { color: DARK.textMuted } : {};
  const continueDisabledStyle = dark ? { backgroundColor: DARK.disabledBg } : {};

  return (
    <SafeAreaView style={[styles.container, containerStyle]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.stepLabel, stepLabelStyle]}>Step 1 of 3</Text>
        </View>

        <View style={styles.titleSection}>
          <View style={styles.textLogoRow}>
            <Text style={[styles.textLogoBlue, dark && styles.textLogoBlueDark]}>Nearby</Text>
            <Text style={[styles.textLogoOrange, dark && styles.textLogoOrangeDark]}>Traveler</Text>
          </View>
          <Text style={[styles.title, titleStyle]}>Join Nearby Traveler</Text>
          <Text style={[styles.subtitle, subtitleStyle]}>Choose how you want to connect</Text>
        </View>

        <View style={styles.optionsSection}>
          {USER_TYPES.map(({ type, icon, title, subtitle, colors }) => {
            const isSelected = userType === type;
            const cardContent = (
              <View style={styles.optionCardInner}>
                <View style={[styles.optionIcon, optionIconBase, isSelected && styles.optionIconSelected]}>
                  <Text style={styles.optionIconText}>{icon}</Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, optionTitleBase, isSelected && styles.optionTitleSelected]}>{title}</Text>
                  <Text style={[styles.optionSubtitle, optionSubtitleBase, isSelected && styles.optionSubtitleSelected]}>{subtitle}</Text>
                </View>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            );
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setUserType(type)}
                activeOpacity={0.8}
                style={[styles.optionCard, !isSelected && optionCardBase, !isSelected && styles.optionCardUnselected]}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.optionCardGradient, { borderColor: colors[0] }]}
                  >
                    {cardContent}
                  </LinearGradient>
                ) : (
                  cardContent
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, !userType && [styles.continueButtonDisabled, continueDisabledStyle]]}
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
  textLogoRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  textLogoBlue: { fontSize: 30, fontWeight: '700', color: '#3B82F6' },
  textLogoBlueDark: { color: '#60A5FA' },
  textLogoOrange: { fontSize: 30, fontWeight: '700', color: '#F97316' },
  textLogoOrangeDark: { color: '#FB923C' },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  optionsSection: { gap: 12, marginBottom: 32 },
  optionCard: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  optionCardUnselected: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionCardGradient: {
    borderRadius: 14,
    borderWidth: 0,
  },
  optionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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

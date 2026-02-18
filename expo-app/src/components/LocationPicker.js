/**
 * LocationPicker - Country, State, City dropdowns matching web SmartLocationInput.
 * Uses same data as client/src/lib/locationData.ts for consistency.
 * Search bar lets you type (e.g. "F" for France) - keyboard shows on iOS.
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import {
  COUNTRIES_PICKER_ORDER,
  CITIES_BY_COUNTRY,
  US_STATES,
  CA_PROVINCES,
  getRegionForCity,
} from '../constants/locationData';

const ORANGE = '#F97316';
const DARK = {
  text: '#ffffff',
  textMuted: '#8e8e93',
  inputBg: '#2c2c2e',
  inputBorder: '#38383a',
  modalBg: '#1c1c1e',
  modalBorder: '#38383a',
};

function PickerField({ label, value, placeholder, onPress, required, dark }) {
  const labelStyle = dark ? { color: DARK.text } : {};
  const touchStyle = dark ? { backgroundColor: DARK.inputBg, borderColor: DARK.inputBorder } : {};
  const textStyle = dark ? { color: DARK.text } : {};
  const placeholderStyle = dark ? { color: DARK.textMuted } : {};
  const chevronStyle = dark ? { color: DARK.textMuted } : {};
  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, labelStyle]}>
        {label} {required ? '*' : ''}
      </Text>
      <TouchableOpacity style={[styles.pickerTouch, touchStyle]} onPress={onPress} activeOpacity={0.7}>
        <Text style={[styles.pickerText, textStyle, !value && [styles.placeholderText, placeholderStyle]]}>
          {value || placeholder}
        </Text>
        <Text style={[styles.chevron, chevronStyle]}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

function OptionModal({ visible, title, options, onSelect, onClose, dark, searchPlaceholder }) {
  const [searchQuery, setSearchQuery] = useState('');
  const optionsScrollRef = useRef(null);
  const modalContentStyle = dark ? { backgroundColor: DARK.modalBg } : {};
  const modalHeaderStyle = dark ? { borderBottomColor: DARK.modalBorder } : {};
  const modalTitleStyle = dark ? { color: DARK.text } : {};
  const optionItemStyle = dark ? { borderBottomColor: DARK.modalBorder } : {};
  const optionTextStyle = dark ? { color: DARK.text } : {};
  const searchBgStyle = dark ? { backgroundColor: DARK.inputBg, borderColor: DARK.inputBorder, color: DARK.text } : {};
  const searchPlaceholderColor = dark ? '#8e8e93' : '#9CA3AF';

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();
    return options.filter((opt) => String(opt).toLowerCase().includes(q));
  }, [options, searchQuery]);

  // Reset search when modal closes
  useEffect(() => {
    if (!visible) setSearchQuery('');
  }, [visible]);

  // When search or filtered list changes, scroll to top so first match (e.g. "N" for New York) is visible
  useEffect(() => {
    if (visible && optionsScrollRef.current) {
      optionsScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [visible, searchQuery, filteredOptions.length]);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalOverlayTapArea} onPress={onClose} />
        <View style={[styles.modalContentFull, modalContentStyle]} pointerEvents="box-none">
          <KeyboardAvoidingView
            style={styles.modalKeyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <View style={[styles.modalHeader, modalHeaderStyle]}>
              <Text style={[styles.modalTitle, modalTitleStyle]}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>Done</Text>
              </TouchableOpacity>
            </View>
            {searchPlaceholder ? (
              <View style={styles.searchContainer}>
                <TextInput
                  style={[styles.searchInput, searchBgStyle]}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={searchPlaceholderColor}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
              </View>
            ) : null}
            <ScrollView
              ref={optionsScrollRef}
              style={styles.optionsScroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {filteredOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionItem, optionItemStyle]}
                  onPress={() => {
                    onSelect(opt);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, optionTextStyle]}>{opt}</Text>
                </TouchableOpacity>
              ))}
              {filteredOptions.length === 0 ? (
                <Text style={[styles.noResults, dark && { color: DARK.textMuted }]}>No matches</Text>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

export default function LocationPicker({
  country,
  state,
  city,
  onLocationChange,
  required = false,
  label = 'Location',
  dark = false,
}) {
  const [showCountry, setShowCountry] = useState(false);
  const [showState, setShowState] = useState(false);
  const [showCity, setShowCity] = useState(false);

  const cities = country ? (CITIES_BY_COUNTRY[country] || []) : [];
  const stateLabel = country === 'United States' ? 'State' : country === 'Canada' ? 'Province' : 'Region';
  const stateOptions = country === 'United States' ? US_STATES : country === 'Canada' ? CA_PROVINCES : [];

  const handleCountrySelect = (c) => {
    onLocationChange({ country: c, state: '', city: '' });
    setShowCountry(false);
  };

  const handleCitySelect = (c) => {
    const autoState = country ? (getRegionForCity(c, country) || '') : '';
    onLocationChange({ country, state: autoState, city: c });
    setShowCity(false);
  };

  const handleStateSelect = (s) => {
    onLocationChange({ country, state: s, city });
    setShowState(false);
  };

  const sectionLabelStyle = dark ? { color: DARK.text } : {};
  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.sectionLabel, sectionLabelStyle]}>{label}</Text> : null}

      <PickerField
        label="Country"
        value={country}
        placeholder="Select country"
        onPress={() => setShowCountry(true)}
        required={required}
        dark={dark}
      />

      {country && cities.length > 0 ? (
        <PickerField
          label="City"
          value={city}
          placeholder="Select city"
          onPress={() => setShowCity(true)}
          required={required}
          dark={dark}
        />
      ) : null}

      {country && city && stateOptions.length > 0 ? (
        <PickerField
          label={stateLabel}
          value={state}
          placeholder={`Select ${stateLabel.toLowerCase()}`}
          onPress={() => setShowState(true)}
          required={required && country === 'United States'}
          dark={dark}
        />
      ) : null}

      <OptionModal
        visible={showCountry}
        title="Select Country"
        options={COUNTRIES_PICKER_ORDER}
        onSelect={handleCountrySelect}
        onClose={() => setShowCountry(false)}
        dark={dark}
        searchPlaceholder="Type to search (e.g. F for France)"
      />
      <OptionModal
        visible={showState}
        title={`Select ${stateLabel}`}
        options={stateOptions}
        onSelect={handleStateSelect}
        onClose={() => setShowState(false)}
        dark={dark}
        searchPlaceholder="Type to search (e.g. CA for California)"
      />
      <OptionModal
        visible={showCity}
        title="Select City"
        options={cities}
        onSelect={handleCitySelect}
        onClose={() => setShowCity(false)}
        dark={dark}
        searchPlaceholder="Type to search (e.g. LA, Miami, Austin)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  sectionLabel: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  pickerTouch: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: { fontSize: 16, color: '#111827' },
  placeholderText: { color: '#9CA3AF' },
  chevron: { fontSize: 12, color: '#6B7280' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOverlayTapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  modalContentFull: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 40,
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 17, fontWeight: '600', color: ORANGE },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 4 },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  optionsScroll: { flex: 1 },
  noResults: { padding: 20, textAlign: 'center', color: '#6B7280', fontSize: 16 },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  optionText: { fontSize: 16, color: '#111827' },
});

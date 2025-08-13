// CENTRALIZED FORM CONSTANTS - SINGLE SOURCE OF TRUTH
// When these are updated, ALL forms across the platform update automatically

export const GENDER_OPTIONS = [
  "Male", 
  "Female", 
  "Trans Male", 
  "Trans Female", 
  "Non-Binary", 
  "Other", 
  "Prefer Not To Say"
];

export const SEXUAL_PREFERENCE_OPTIONS = [
  "Straight", 
  "Gay", 
  "Lesbian", 
  "Bisexual", 
  "Pansexual", 
  "Asexual", 
  "Demisexual", 
  "Sapiosexual", 
  "Queer", 
  "Prefer not to say"
];

// Privacy note constants for consistency across all forms
export const PRIVACY_NOTES = {
  SEXUAL_PREFERENCE: "Can be hidden from public view later while still being used for matching",
  DATE_OF_BIRTH: "Can be hidden from public view later while still being used for matching",
  AGE_MATCHING: "Can be hidden from public view later while still being used for matching"
};

// Form section headers for consistency
export const FORM_HEADERS = {
  GENDER_SEXUAL_PREFERENCE: "Gender & Sexual Preference",
  DATE_OF_BIRTH: "Date of Birth & Age Settings",
  PRIVACY_SETTINGS: "Privacy & Visibility Settings"
};

// User type options
export const USER_TYPE_OPTIONS = [
  "Traveler", 
  "Local", 
  "Business"
];
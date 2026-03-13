/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string | null): number | null {
  if (!dateOfBirth) return null;
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  // Validate year is 4 digits
  if (birthDate.getFullYear() < 1000 || birthDate.getFullYear() > 9999) {
    return null;
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  // Ensure age is not more than 99 years
  if (age > 99) {
    return null;
  }
  
  return age;
}

/**
 * Check if user is 18 or older
 */
export function isAdult(dateOfBirth: Date | string | null): boolean {
  const age = calculateAge(dateOfBirth);
  return age !== null && age >= 18;
}

/**
 * Format date of birth for form input (YYYY-MM-DD)
 */
export function formatDateOfBirthForInput(dateOfBirth: Date | string | null): string {
  if (!dateOfBirth) return "";
  
  const date = new Date(dateOfBirth);
  return date.toISOString().split('T')[0];
}

/**
 * Validate date input for proper year format and age limits
 */
export function validateDateInput(dateString: string): { isValid: boolean; message: string } {
  if (!dateString) {
    return { isValid: false, message: "Date is required" };
  }

  // Check date format (YYYY-MM-DD)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateString)) {
    return { isValid: false, message: "Date must be in YYYY-MM-DD format" };
  }

  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return { isValid: false, message: "Invalid date" };
  }

  const year = date.getFullYear();
  
  // Ensure year is exactly 4 digits
  if (year < 1000 || year > 9999) {
    return { isValid: false, message: "Please enter a valid year" };
  }

  // Check age limit for date of birth
  const age = calculateAge(date);
  if (age !== null && age > 99) {
    return { isValid: false, message: "Age cannot be more than 99 years" };
  }

  // Check if date is not in the future for birth dates
  const today = new Date();
  if (date > today) {
    return { isValid: false, message: "Date cannot be in the future" };
  }

  return { isValid: true, message: "" };
}

/**
 * Validate that a date of birth string belongs to someone 18 or older.
 * Returns { isValid, message } — message is empty string when valid.
 */
export function validate18Plus(dateString: string): { isValid: boolean; message: string } {
  if (!dateString) {
    return { isValid: false, message: "Date of birth is required." };
  }

  const birthDate = new Date(dateString);
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, message: "Please enter a valid date of birth." };
  }

  if (birthDate > new Date()) {
    return { isValid: false, message: "Date of birth cannot be in the future." };
  }

  const age = calculateAge(birthDate);
  if (age === null || age < 18) {
    return { isValid: false, message: "You must be at least 18 years old to join Nearby Traveler." };
  }

  return { isValid: true, message: "" };
}

/**
 * Get date input constraints for HTML date inputs.
 * max is capped at 18 years ago so the date picker itself prevents underage entry.
 */
export function getDateInputConstraints(): { min: string; max: string } {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Minimum date: 99 years ago
  const min = `${currentYear - 99}-01-01`;
  
  // Maximum date: exactly 18 years ago today (enforces 18+ at the picker level)
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const max = maxDate.toISOString().split('T')[0];
  
  return { min, max };
}
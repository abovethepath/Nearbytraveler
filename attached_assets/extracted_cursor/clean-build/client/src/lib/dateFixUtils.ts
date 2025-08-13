/**
 * Utility function to parse dates without timezone conversion issues
 * This prevents the common bug where dates shift by a day due to timezone conversion
 */
export const parseLocalDate = (dateInput: string | Date | null | undefined): Date | null => {
  if (!dateInput) return null;
  
  let dateString: string;
  if (dateInput instanceof Date) {
    // If it's already a Date object, convert to ISO string and extract date part
    dateString = dateInput.toISOString();
  } else {
    dateString = dateInput;
  }
  
  // Extract date components manually to avoid timezone conversion
  const parts = dateString.split('T')[0].split('-'); // Get just the date part before 'T'
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  return null;
};
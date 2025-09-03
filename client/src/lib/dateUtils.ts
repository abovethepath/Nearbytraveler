// Centralized date utility functions for consistent formatting across the app

/**
 * Get user's timezone based on their hometown
 */
export function getUserTimezone(userCity?: string): string {
  if (!userCity) return 'America/Los_Angeles'; // Default to Pacific
  
  const city = userCity.toUpperCase();
  
  // Map common cities to their timezones
  const timezoneMap: Record<string, string> = {
    'PLAYA DEL REY': 'America/Los_Angeles',
    'LOS ANGELES': 'America/Los_Angeles',
    'NEW YORK': 'America/New_York',
    'CHICAGO': 'America/Chicago',
    'DENVER': 'America/Denver',
    'LONDON': 'Europe/London',
    'PARIS': 'Europe/Paris',
    'TOKYO': 'Asia/Tokyo',
    'MADRID': 'Europe/Madrid',
    'ROME': 'Europe/Rome',
    'BERLIN': 'Europe/Berlin',
    'SYDNEY': 'Australia/Sydney'
  };
  
  return timezoneMap[city] || 'America/Los_Angeles';
}

/**
 * Format a date string for HTML input fields (YYYY-MM-DD)
 * Simple approach that avoids timezone conversion issues
 */
export function formatDateForInput(dateString: string | Date, userCity?: string): string {
  if (!dateString) return '';
  
  // Handle date strings that are already in YYYY-MM-DD format
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // For ISO date strings (e.g., "2025-06-14T00:00:00.000Z"), extract just the date part
  if (typeof dateString === 'string' && dateString.includes('T')) {
    const datePart = dateString.split('T')[0];
    return datePart;
  }
  
  // For other date formats, convert to Date and format manually
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  // Use UTC methods to avoid timezone issues in input fields
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string for display in the UI (localized format)
 * Uses user's hometown timezone for consistent date display
 */
export function formatDateForDisplay(dateString: string | Date, userCity?: string): string {
  if (!dateString) return '';
  
  // For ISO date strings (e.g., "2025-06-14T00:00:00.000Z"), create date from just the date part
  if (typeof dateString === 'string' && dateString.includes('T')) {
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    // CRITICAL: Always show 4-digit years as requested by user
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', // This ensures 4-digit year (2025, not 25)
      month: 'short',
      day: 'numeric'
    });
    return formatter.format(date);
  }
  
  // Handle other date formats with timezone-safe parsing
  let dateString_safe: string;
  if (dateString instanceof Date) {
    dateString_safe = dateString.toISOString();
  } else {
    dateString_safe = dateString;
  }
  
  // Parse date components manually to avoid timezone conversion
  const parts = dateString_safe.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const date = new Date(year, month, day);
    
    // CRITICAL: Always show 4-digit years as requested by user
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', // This ensures 4-digit year (2025, not 25)
      month: 'short',
      day: 'numeric'
    });
    return formatter.format(date);
  }
  
  // Final fallback - try original approach but with caution
  const date = new Date(dateString);
  const timezone = getUserTimezone(userCity);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  return formatter.format(date);
}

/**
 * Format a date range for display (e.g., "Jun 16 - Jun 20")
 */
export function formatDateRange(startDate: string | Date, endDate: string | Date, userCity?: string): string {
  const start = formatDateForDisplay(startDate, userCity);
  const end = formatDateForDisplay(endDate, userCity);
  return `${start} - ${end}`;
}

/**
 * Check if two date ranges overlap
 */
export function datesOverlap(
  start1: string | Date, end1: string | Date,
  start2: string | Date, end2: string | Date
): boolean {
  // Use timezone-safe date parsing for all dates
  const parseDate = (dateInput: string | Date): Date => {
    if (!dateInput) return new Date();
    
    let dateString: string;
    if (dateInput instanceof Date) {
      dateString = dateInput.toISOString();
    } else {
      dateString = dateInput;
    }
    
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return new Date(dateInput);
  };
  
  const startDate1 = parseDate(start1);
  const endDate1 = parseDate(end1);
  const startDate2 = parseDate(start2);
  const endDate2 = parseDate(end2);
  
  return startDate1 <= endDate2 && startDate2 <= endDate1;
}

/**
 * Get today's date in YYYY-MM-DD format for input field minimum values
 */
export function getTodayForInput(userCity?: string): string {
  const today = new Date();
  return formatDateForInput(today, userCity);
}

/**
 * Parse a date string from input field and return a proper Date object
 * Uses user's hometown timezone for consistent date handling
 */
export function parseInputDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Handle different date formats and validate
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return new Date();
    }
    
    // Create date in user's timezone
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`;
    const date = new Date(dateStr);
    return date;
  } catch (error) {
    return new Date();
  }
}

/**
 * Check if a user is currently traveling based on their travel plans
 * CRITICAL: Users only become NEARBY TRAVELERS when trip dates are active
 * Returns destination string for display, null if not traveling
 */
export function getCurrentTravelDestination(travelPlans: any[]): string | null {
  if (!travelPlans || !Array.isArray(travelPlans) || travelPlans.length === 0) {
    console.log('🚨 TRAVEL DEBUG: No travel plans provided');
    return null;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log('🚨 TRAVEL DEBUG: Today date for comparison:', today.toISOString(), 'Plans count:', travelPlans.length);
  
  // Check travel plans array for active trips - ONLY active trips make someone a NEARBY TRAVELER
  for (const plan of travelPlans) {
    if (plan.startDate && plan.endDate && plan.destination) {
      // Use timezone-safe date parsing for travel plan dates
      const parseDate = (dateString: string | Date): Date => {
        if (!dateString) return new Date();
        
        let inputString: string;
        if (dateString instanceof Date) {
          inputString = dateString.toISOString();
        } else {
          inputString = dateString;
        }
        
        const parts = inputString.split('T')[0].split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          return new Date(year, month, day);
        }
        return new Date(dateString);
      };
      
      const startDate = parseDate(plan.startDate);
      const endDate = parseDate(plan.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      // TEMPORAL LOGIC: Only active trips count - future trips don't make someone a traveler yet
      console.log('🚨 TRAVEL DEBUG: Comparing dates for plan', plan.id, {
        today: today.toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isCurrentTrip: today >= startDate && today <= endDate,
        destination: plan.destination
      });
      
      if (today >= startDate && today <= endDate) {
        // Parse destination into consistent field naming
        const destinationParts = plan.destination.split(', ');
        const [destinationCity, destinationState = null, destinationCountry] = destinationParts;
        
        console.log('🚨 TRAVEL DEBUG: ACTIVE TRIP FOUND!', plan.destination);
        // ALWAYS return the destination if there's an active trip, even if it's the same as hometown
        return plan.destination; // Return the full destination string for display
      }
    }
  }
  
  // No active trips = User is NEARBY LOCAL only (future trips don't count)
  return null;
}
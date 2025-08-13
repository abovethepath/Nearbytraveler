// Location normalization utility
export function normalizeLocation(location: string): string {
  if (!location) return '';
  
  // Basic normalization - trim and standardize format
  return location.trim()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .toLowerCase();
}
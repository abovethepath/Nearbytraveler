export function formatChatroomName(name: string): string {
  return (name || '')
    .replace(/^Welcome\s+to\s+Nearby\s+Traveler\b/i, 'Nearby Traveler')
    .replace(/^Welcome\s+Newcomers?\s+/i, '')
    .replace(/^Welcome\s+to\s+/i, '')
    .trim();
}

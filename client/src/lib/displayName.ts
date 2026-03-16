// Well-known city abbreviations used when space is limited
const CITY_ABBREVIATIONS: Record<string, string> = {
  'new york city': 'NYC',
  'new york': 'NYC',
  'los angeles': 'LA',
  'san francisco': 'SF',
  'washington dc': 'DC',
  'washington d.c.': 'DC',
  'washington, dc': 'DC',
  'washington, d.c.': 'DC',
  'las vegas': 'Vegas',
  'salt lake city': 'SLC',
  'kansas city': 'KC',
  'oklahoma city': 'OKC',
  'new orleans': 'NOLA',
  'san diego': 'SD',
  'san jose': 'San José',
  'minneapolis': 'Mpls',
  'philadelphia': 'Philly',
  'philadelphia pa': 'Philly',
  'los angeles metro': 'LA Metro',
};

/**
 * Abbreviates a city name if a well-known short form exists.
 * Use in compact UI spaces where long names would be truncated.
 */
export function abbreviateCity(city: string | null | undefined): string {
  if (!city) return '';
  const key = city.trim().toLowerCase();
  return CITY_ABBREVIATIONS[key] ?? city;
}

type MinimalUser = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  username?: string | null;
  businessName?: string | null;
  userType?: string | null;
};

export function getDisplayName(user: MinimalUser | null | undefined): string {
  if (!user) return '';
  if (user.userType === 'business' && user.businessName) return user.businessName;
  const raw = user.firstName || user.username || '';
  return raw.split(' ')[0];
}

export function getUserInitial(user: MinimalUser | null | undefined): string {
  if (!user) return '?';
  const name = getDisplayName(user);
  return name.charAt(0).toUpperCase() || '?';
}

export function getNameAndHandle(user: MinimalUser | null | undefined): { displayName: string; handle: string } {
  if (!user) return { displayName: '', handle: '' };
  const displayName = getDisplayName(user);
  const handle = user.username ? `@${user.username}` : '';
  return { displayName, handle };
}

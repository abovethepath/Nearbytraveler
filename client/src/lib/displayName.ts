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
  return user.firstName || user.username || '';
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

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

// Muted palette; index from hash of userId for consistent color per user
const AVATAR_COLORS = [
  '#E0E7FF', '#C7D2FE', '#DDD6FE', '#EDE9FE', '#FCE7F3', '#FBCFE8',
  '#D1FAE5', '#A7F3D0', '#CCFBF1', '#CFFAFE', '#E0F2FE', '#DBEAFE',
  '#FEF3C7', '#FDE68A', '#FED7AA', '#FFEDD5',
];

function hashUserId(id) {
  if (id == null) return 0;
  const str = String(id);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

function getInitials(user) {
  const name = user?.fullName || user?.name || user?.username || '';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  return (name[0] || '?').toUpperCase().slice(0, 2);
}

function getImageUrl(user) {
  return user?.profileImage || user?.profileImageUrl || null;
}

/**
 * User avatar: profile image or initials in a colored circle.
 * Tappable: navigates to WebView /users/:id with title.
 * Pass root navigation (e.g. navigation.getParent()?.getParent() ?? navigation) so WebView is reachable.
 */
export default function UserAvatar({ user, size = 52, navigation, style }) {
  const imageUrl = getImageUrl(user);
  const initials = getInitials(user);
  const bgColor = AVATAR_COLORS[hashUserId(user?.id) % AVATAR_COLORS.length];
  const containerStyle = [styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }, style];

  const onPress = () => {
    if (!user?.id || !navigation) return;
    const rootNav = navigation.getParent?.()?.getParent?.() ?? navigation;
    rootNav.navigate('WebView', {
      path: `/users/${user.id}`,
      title: user.fullName || user.name || user.username || 'Profile',
    });
  };

  const content = imageUrl ? (
    <Image source={{ uri: imageUrl }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
  ) : (
    <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.4) }]} numberOfLines={1}>{initials}</Text>
  );

  if (!navigation) {
    return <View style={containerStyle}>{content}</View>;
  }

  return (
    <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.8}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { backgroundColor: 'transparent' },
  initials: { color: '#374151', fontWeight: '700' },
});

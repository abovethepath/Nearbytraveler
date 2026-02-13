import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import UserAvatar from '../components/UserAvatar';

const ConversationCard = ({ conversation, onPress, navigation }) => {
  const otherUser = conversation.otherUser || {};
  const lastMsg = conversation.lastMessage;
  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return mins + 'm';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h';
    return Math.floor(hours / 24) + 'd';
  };
  return (
    <TouchableOpacity style={styles.conversationCard} onPress={() => onPress(conversation)} activeOpacity={0.7}>
      <UserAvatar user={otherUser} size={52} navigation={navigation} style={styles.avatar} />
      <View style={styles.conversationInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName} numberOfLines={1}>{otherUser.fullName || otherUser.username || 'User'}</Text>
          {lastMsg && <Text style={styles.timeText}>{timeAgo(lastMsg.createdAt || lastMsg.sentAt)}</Text>}
        </View>
        <Text style={[styles.lastMessage, conversation.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>{lastMsg ? (lastMsg.content || 'Sent a message') : 'Start a conversation'}</Text>
      </View>
      {conversation.unreadCount > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadCount}>{conversation.unreadCount}</Text></View>}
    </TouchableOpacity>
  );
};

export default function MessagesScreen({ navigation }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    try { const data = await api.getConversations(user.id); setConversations(Array.isArray(data) ? data : []); }
    catch (e) { console.log('Failed to fetch conversations:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  const onRefresh = () => { setRefreshing(true); fetchConversations(); };
  const handlePress = (conv) => {
    const other = conv.otherUser || {};
    navigation.navigate('Chat', { userId: other.id, userName: other.fullName || other.username, otherUser: other });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Messages</Text></View>
      {loading ? <View style={styles.centered}><ActivityIndicator size={36} color="#F97316" /></View> : (
        <FlatList data={conversations} keyExtractor={(item, i) => String(item.id || i)} renderItem={({ item }) => <ConversationCard conversation={item} onPress={handlePress} navigation={navigation} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>&#x1F4AC;</Text><Text style={styles.emptyTitle}>No messages yet</Text><Text style={styles.emptySubtitle}>Connect with travelers to start chatting</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },
  conversationCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  avatar: { marginRight: 14 },
  conversationInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  userName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  timeText: { fontSize: 12, color: '#9CA3AF' },
  lastMessage: { fontSize: 14, color: '#9CA3AF', lineHeight: 20 },
  unreadMessage: { color: '#374151', fontWeight: '600' },
  unreadBadge: { backgroundColor: '#F97316', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  unreadCount: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF' },
});

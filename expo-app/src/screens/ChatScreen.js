import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import UserAvatar from '../components/UserAvatar';

const MessageBubble = ({ message, isOwn }) => (
  <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
    <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
      <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{message.content}</Text>
    </View>
  </View>
);

export default function ChatScreen({ route, navigation }) {
  const { userId, userName, otherUser: paramUser } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchMessages = async () => {
    try { const data = await api.getMessages(userId); setMessages(Array.isArray(data) ? data.reverse() : []); }
    catch (e) { console.log('Failed to fetch messages:', e); }
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try { await api.sendMessage(user?.id, userId, text.trim()); setText(''); await fetchMessages(); }
    catch (e) { console.log('Failed to send:', e); }
    finally { setSending(false); }
  };

  const chatUser = paramUser && paramUser.id ? paramUser : { id: userId, fullName: userName, username: userName };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>Back</Text></TouchableOpacity>
        <View style={styles.headerCenter}>
          <UserAvatar user={chatUser} size={36} navigation={navigation} style={styles.headerAvatar} />
          <Text style={styles.headerName}>{userName || 'Chat'}</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatArea} keyboardVerticalOffset={90}>
        <FlatList data={messages} keyExtractor={(item, i) => String(item.id || i)} renderItem={({ item }) => <MessageBubble message={item} isOwn={item.senderId === user?.id} />}
          inverted contentContainerStyle={styles.messagesList}
          ListEmptyComponent={<View style={styles.emptyChat}><Text style={styles.emptyChatText}>Say hello!</Text></View>}
        />
        <View style={styles.inputBar}>
          <TextInput style={styles.textInput} placeholder="Type a message..." placeholderTextColor="#9CA3AF" value={text} onChangeText={setText} multiline maxLength={2000} />
          <TouchableOpacity style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]} onPress={handleSend} disabled={!text.trim() || sending}>
            <Text style={styles.sendText}>&#x2191;</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  headerAvatar: { marginRight: 0 },
  headerName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  chatArea: { flex: 1 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 12 },
  bubbleRow: { flexDirection: 'row', marginBottom: 8 },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18 },
  bubbleOwn: { backgroundColor: '#F97316', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: '#374151', lineHeight: 21 },
  bubbleTextOwn: { color: '#FFFFFF' },
  emptyChat: { alignItems: 'center', paddingTop: 40 },
  emptyChatText: { fontSize: 16, color: '#9CA3AF' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  textInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: '#111827', maxHeight: 100, marginRight: 10 },
  sendButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#D1D5DB' },
  sendText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
});

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Keyboard, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, MessageCircle, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useThemeColors } from '../hooks/useThemeColors';

export default function GroupChatScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  const { user, userToken } = useAuth();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const socketRef = useRef<Socket | null>(null);

  const rawRideId = params.rideId;
  const rideId = Array.isArray(rawRideId) ? rawRideId[0] : rawRideId;
  const title = Array.isArray(params.title) ? params.title[0] : params.title;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastReadTime, setLastReadTime] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!rideId || rideId === 'undefined' || rideId === 'null') return;

    let pollInterval: ReturnType<typeof setInterval>;
    const initializeChat = async () => {
      try {
        const storageKey = `last_read_ride_${rideId}`;
        const lastRead = await AsyncStorage.getItem(storageKey);
        const currentReadTime = lastRead ? new Date(lastRead).getTime() : Date.now();
        setLastReadTime(currentReadTime);
        const res = await client.get(`/rides/${rideId}/messages`);
        const history = Array.isArray(res.data) ? res.data : [];
        history.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setMessages(history);
        await AsyncStorage.setItem(storageKey, new Date().toISOString());
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 200);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    initializeChat();

    pollInterval = setInterval(async () => {
      try {
        const res = await client.get(`/rides/${rideId}/messages`);
        if (Array.isArray(res.data)) {
          setMessages((prev) => {
            const newMsgs = [...prev];
            let hasChanges = false;
            res.data.forEach((incomingMsg: any) => {
              if (!newMsgs.find(m => m.id === incomingMsg.id)) { newMsgs.push(incomingMsg); hasChanges = true; }
            });
            if (hasChanges) {
              newMsgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              return newMsgs;
            }
            return prev;
          });
        }
      } catch (error) {}
    }, 5000);

    const validRideId = String(rideId);
    const socket = io('https://api.nisu.app', {
      transports: ['websocket'],
      query: { rideId: validRideId },
      auth: { token: userToken }
    });
    socketRef.current = socket;
    socket.on('connect', () => { setIsConnected(true); socket.emit('joinRoom', validRideId); });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('newMessage', (message: any) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => { socket.disconnect(); if (pollInterval) clearInterval(pollInterval); };
  }, [rideId, userToken]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
    return () => showSub.remove();
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    const text = newMessage.trim();
    setNewMessage('');
    try {
      const res = await client.post(`/rides/${rideId}/messages`, { content: text });
      setMessages((prev) => {
        if (prev.some(m => m.id === res.data?.id)) return prev;
        return [...prev, res.data];
      });
    } catch (error) { console.error('Failed to send message', error); }
  };

  const getAvatarUrl = (path?: string, name: string = 'User') => {
    if (!path) return `https://ui-avatars.com/api/?name=${name}&background=f97316&color=fff`;
    return path.startsWith('http') ? path : `https://api.nisu.app/${path.startsWith('/') ? path.substring(1) : path}`;
  };

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return t('today', 'Today');
    const yesterday = new Date(Date.now() - 86400000);
    if (d.toDateString() === yesterday.toDateString()) return t('yesterday', 'Yesterday');
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const participantCount = new Set(messages.map(m => m.sender_id || m.sender?.id)).size;
  const canSend = newMessage.trim().length > 0;

  // Bottom inset: keyboard takes over when open; otherwise respect home indicator / gesture nav
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={[c.primary, c.accentRose, c.accentAmber]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title ? decodeURIComponent(title) : t('ride_chat_default', 'Ride Chat')}
            </Text>
            <View style={styles.headerMeta}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? '#86efac' : '#fde047' }]} />
              <Text style={styles.statusText}>{isConnected ? t('chat_live_status', 'Live') : t('chat_sync_status', 'Syncing...')}</Text>
              {participantCount > 0 && (
                <>
                  <Text style={styles.metaDivider}>{'  ·  '}</Text>
                  <Users size={11} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.statusText}> {participantCount}</Text>
                </>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Body */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={c.primary} size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centered}>
            <View style={[styles.emptyIcon, { backgroundColor: c.muted }]}>
              <MessageCircle size={36} color={c.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>{t('no_messages_title', 'No messages yet')}</Text>
            <Text style={[styles.emptyDesc, { color: c.mutedForeground }]}>{t('no_messages_desc', 'Be the first to send a message!')}</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            keyboardDismissMode="interactive"
          >
            {messages.map((msg, index) => {
              const isMe = String(msg.sender_id || msg.userId || msg.sender?.id || '').toLowerCase() === String(user?.id || '').toLowerCase();
              const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              const rawTime = new Date(msg.created_at).getTime();
              const isNewBoundary = lastReadTime && rawTime > lastReadTime && (!messages[index - 1] || new Date(messages[index - 1].created_at).getTime() <= lastReadTime) && !isMe;

              const prevDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null;
              const currDate = new Date(msg.created_at).toDateString();
              const showDateSep = index === 0 || prevDate !== currDate;

              const prevSender = index > 0 ? String(messages[index - 1].sender_id || messages[index - 1].sender?.id || '') : '';
              const currSender = String(msg.sender_id || msg.sender?.id || '');
              const isConsecutive = !showDateSep && prevSender === currSender && !isNewBoundary;

              return (
                <View key={msg.id || index}>
                  {showDateSep && (
                    <View style={styles.dateSep}>
                      <View style={[styles.dateSepLine, { backgroundColor: c.border }]} />
                      <View style={[styles.dateSepPill, { backgroundColor: c.cardElevated, borderColor: c.border }]}>
                        <Text style={[styles.dateSepText, { color: c.mutedForeground }]}>{getDateLabel(msg.created_at)}</Text>
                      </View>
                      <View style={[styles.dateSepLine, { backgroundColor: c.border }]} />
                    </View>
                  )}

                  {isNewBoundary && (
                    <View style={styles.newMsgDivider}>
                      <View style={[styles.newMsgLine, { backgroundColor: c.primary, opacity: 0.35 }]} />
                      <Text style={[styles.newMsgText, { color: c.primary }]}>{t('new_messages_divider', 'New Messages')}</Text>
                      <View style={[styles.newMsgLine, { backgroundColor: c.primary, opacity: 0.35 }]} />
                    </View>
                  )}

                  <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft, isConsecutive && { marginTop: -4 }]}>
                    {!isMe && (
                      <View style={styles.avatarSlot}>
                        {!isConsecutive ? (
                          <Image source={{ uri: getAvatarUrl(msg.sender?.profile_picture, msg.sender?.first_name) }} style={[styles.avatar, { backgroundColor: c.muted }]} />
                        ) : (
                          <View style={styles.avatarSpacer} />
                        )}
                      </View>
                    )}

                    {isMe ? (
                      <LinearGradient
                        colors={[c.primary, c.accentRose]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.bubble,
                          styles.bubbleMe,
                          !isConsecutive && styles.bubbleMeFirst,
                        ]}
                      >
                        <Text style={[styles.msgText, { color: '#ffffff' }]}>{msg.content}</Text>
                        <Text style={[styles.msgTime, { color: 'rgba(255,255,255,0.75)' }]}>{msgTime}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[
                        styles.bubble,
                        styles.bubbleOther,
                        { backgroundColor: c.card, borderColor: c.border },
                        !isConsecutive && styles.bubbleOtherFirst,
                      ]}>
                        {!isConsecutive && (
                          <Text style={[styles.senderName, { color: c.primary }]}>{msg.sender?.first_name || 'User'}</Text>
                        )}
                        <Text style={[styles.msgText, { color: c.foreground }]}>{msg.content}</Text>
                        <Text style={[styles.msgTime, { color: c.mutedForeground }]}>{msgTime}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            <View style={{ height: 8 }} />
          </ScrollView>
        )}

        {/* Input bar — bottom-inset aware so it never sits under home indicator / nav bar */}
        <View style={[
          styles.inputBar,
          {
            backgroundColor: c.card,
            borderTopColor: c.border,
            paddingBottom: bottomPad,
          },
        ]}>
          <View style={[
            styles.inputWrapper,
            {
              backgroundColor: c.cardElevated,
              borderColor: isFocused ? c.primary : c.border,
            },
          ]}>
            <TextInput
              style={[styles.input, { color: c.foreground }]}
              placeholder={t('chat_placeholder', 'Type a message...')}
              placeholderTextColor={c.mutedForeground}
              value={newMessage}
              onChangeText={setNewMessage}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!canSend}
            activeOpacity={0.85}
            style={canSend ? styles.sendBtnShadow : undefined}
          >
            {canSend ? (
              <LinearGradient
                colors={[c.primary, c.accentRose]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtn}
              >
                <Send size={18} color="#ffffff" style={{ marginLeft: 2 }} />
              </LinearGradient>
            ) : (
              <View style={[styles.sendBtn, { backgroundColor: c.muted }]}>
                <Send size={18} color={c.mutedForeground} style={{ marginLeft: 2 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  metaDivider: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },

  // Center states
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  // Message list
  messageList: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8 },

  // Date separator
  dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dateSepLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dateSepPill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, marginHorizontal: 10, borderWidth: StyleSheet.hairlineWidth },
  dateSepText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

  // New messages divider
  newMsgDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  newMsgLine: { flex: 1, height: 1 },
  newMsgText: { marginHorizontal: 12, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Message rows
  msgRow: { flexDirection: 'row', marginBottom: 4, paddingHorizontal: 2 },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },

  // Avatar
  avatarSlot: { width: 36, marginRight: 8, justifyContent: 'flex-end' },
  avatar: { width: 30, height: 30, borderRadius: 15 },
  avatarSpacer: { width: 30 },

  // Bubbles
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22 },
  bubbleMe: { borderBottomRightRadius: 6, shadowColor: '#f97316', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 2 },
  bubbleMeFirst: { borderTopRightRadius: 22, borderBottomRightRadius: 6 },
  bubbleOther: { borderBottomLeftRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  bubbleOtherFirst: { borderTopLeftRadius: 22, borderBottomLeftRadius: 6 },

  // Message content
  senderName: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  msgText: { fontSize: 15, lineHeight: 21 },
  msgTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },

  // Input bar
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  inputWrapper: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 6, minHeight: 46, maxHeight: 120, justifyContent: 'center', borderWidth: 1.5 },
  input: { fontSize: 15, lineHeight: 20, maxHeight: 100 },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sendBtnShadow: { shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 },
});

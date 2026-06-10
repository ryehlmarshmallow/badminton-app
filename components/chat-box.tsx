'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Message {
  id: string;
  room_id: string;
  profile_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

interface ChatBoxProps {
  roomId: string;
  currentUserId: string;
  isJoined: boolean;
}

export function ChatBox({ roomId, currentUserId, isJoined }: ChatBoxProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const profilesCacheRef = useRef<Record<string, string>>({});

  // 1. Fetch chat history and populate profile cache
  useEffect(() => {
    async function fetchChatHistory() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            room_id,
            profile_id,
            content,
            created_at,
            profiles ( full_name )
          `)
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          const fetchedMessages = data as unknown as Message[];
          // Populate profile cache
          fetchedMessages.forEach((msg) => {
            if (msg.profile_id && msg.profiles?.full_name) {
              profilesCacheRef.current[msg.profile_id] = msg.profiles.full_name;
            }
          });
          setMessages(fetchedMessages);
        }
      } catch (err) {
        console.error('Lỗi khi tải lịch sử trò chuyện:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChatHistory();
  }, [roomId, supabase]);

  // 2. Subscribe to realtime inserts
  useEffect(() => {
    const channel = supabase
      .channel(`room-chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newPayload = payload.new as {
            id: string;
            room_id: string;
            profile_id: string;
            content: string;
            created_at: string;
          };

          const profileId = newPayload.profile_id;
          let senderName = 'Người dùng';

          // Get profile name from cache or DB
          const cachedName = profilesCacheRef.current[profileId];
          if (cachedName) {
            senderName = cachedName;
          } else {
            const { data } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', profileId)
              .single();
            if (data?.full_name) {
              senderName = data.full_name;
              profilesCacheRef.current[profileId] = data.full_name;
            }
          }

          const newMsg: Message = {
            id: newPayload.id,
            room_id: newPayload.room_id,
            profile_id: newPayload.profile_id,
            content: newPayload.content,
            created_at: newPayload.created_at,
            profiles: { full_name: senderName },
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status, err) => {
        console.log(`Realtime subscription status for room ${roomId}:`, status, err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 3. Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const content = newMessage;
    setNewMessage('');
    setIsSending(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          profile_id: currentUserId,
          content: content,
        })
        .select(`
          id,
          room_id,
          profile_id,
          content,
          created_at,
          profiles ( full_name )
        `)
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data as unknown as Message];
        });
      }
    } catch (err: any) {
      alert(`Không thể gửi tin nhắn: ${err.message || 'Lỗi không xác định'}`);
      setNewMessage(content); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  // Format created_at to short time HH:MM
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/30">
      {/* Chat header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-2">
        <MessageSquare size={16} className="text-emerald-500" />
        <span className="font-bold text-sm text-zinc-850 dark:text-zinc-200">Kênh trò chuyện</span>
        {isJoined && (
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 px-2 py-0.5 rounded-full font-medium ml-auto">
            Đã tham gia
          </span>
        )}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="text-xs">Đang tải lịch sử...</span>
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.profile_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[80%] ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5 px-1 font-semibold">
                  {msg.profiles?.full_name || 'Người dùng'}
                </span>
                <div className={`flex items-end gap-1.5 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {isMe && (
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-550 shrink-0">
                      {formatTime(msg.created_at)}
                    </span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                      isMe
                        ? 'bg-emerald-600 dark:bg-emerald-700 text-white rounded-tr-none'
                        : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-800 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {!isMe && (
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-550 shrink-0">
                      {formatTime(msg.created_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2 py-10">
            <MessageSquare size={24} className="text-zinc-300 dark:text-zinc-700" />
            <span className="text-xs italic">Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện!</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        {isJoined ? (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Nhập nội dung trò chuyện..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
              className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg py-2 px-3 focus-visible:ring-emerald-500"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || isSending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9 w-9"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </form>
        ) : (
          <div className="text-center text-xs py-2 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
            Bạn cần tham gia phòng để trò chuyện.
          </div>
        )}
      </div>
    </div>
  );
}

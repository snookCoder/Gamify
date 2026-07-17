import React, { useState, useEffect, useRef } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { Send, Smile, MessageSquare } from 'lucide-react';

export const MusicChat: React.FC = () => {
  const { room, isRoomMode, sendChatMessage } = useMusicStore();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [room?.chatMessages]);

  if (!isRoomMode || !room) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendChatMessage(text.trim());
    setText('');
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const quickEmojis = ['😂', '🔥', '🎵', '❤️', '👏', '🎉', '😢', '😮'];

  return (
    <div className="w-full lg:w-80 h-80 lg:h-full glass-panel border border-white/5 rounded-3xl flex flex-col overflow-hidden relative shadow-2xl shrink-0">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-3 border-b border-white/5 bg-slate-950/20 flex items-center gap-2 select-none z-10 shrink-0">
        <MessageSquare className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">
          Party Live Chat
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10">
        {room.chatMessages.map((msg) => {
          if (msg.isSystem || !msg.sender) {
            return (
              <div key={msg.id} className="text-center py-1">
                <span className="text-[10px] text-purple-350 italic bg-purple-950/20 px-2.5 py-1 rounded-full border border-purple-500/5 inline-block max-w-[90%] break-words">
                  📢 {msg.message}
                </span>
              </div>
            );
          }

          const isMe = msg.sender.id === useMusicStore.getState().room?.players.find(p => p.socketId === useGameStore.getState().socket?.id)?.id;

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1 mb-0.5 select-none">
                <span className="text-[9px] font-bold text-gray-400 font-mono">
                  {msg.sender.username}
                </span>
              </div>
              <div className={`px-3 py-1.5 rounded-2xl text-xs max-w-[85%] break-words shadow-sm border
                ${isMe 
                  ? 'bg-gradient-to-r from-emerald-600/20 to-purple-600/20 border-purple-500/25 text-white rounded-tr-none' 
                  : 'bg-slate-900/60 border-white/5 text-gray-200 rounded-tl-none'}`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis Drawer */}
      <div className="px-3 py-1 bg-slate-950/40 border-t border-white/5 flex gap-1 justify-between select-none shrink-0 z-10">
        {quickEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-slate-950/20 flex gap-2 shrink-0 z-10">
        <input
          type="text"
          placeholder="Send chat, say hi..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-slate-950/60 border border-white/10 rounded-2xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all font-sans"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer flex items-center justify-center shadow-md shadow-purple-600/20"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

// Helper inside file to grab game store socket id
import { useGameStore } from '../../store/useGameStore';

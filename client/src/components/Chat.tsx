'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Avatar } from './ui/Avatar';
import { Send } from 'lucide-react';

export const Chat: React.FC = () => {
  const { chatMessages, sendChatMessage, sendTypingStatus, typingPlayers } = useGameStore();
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendChatMessage(messageInput.trim());
      setMessageInput('');
      sendTypingStatus(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    sendTypingStatus(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  const typingList = Object.entries(typingPlayers)
    .filter(([id]) => id !== user?.id)
    .map(([_, name]) => name);

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[400px] border border-white/5 shadow-lg overflow-hidden">
      <div className="bg-slate-950/40 px-4 py-3 border-b border-white/5">
        <h3 className="font-display font-bold text-xs text-gray-300 tracking-wider uppercase">
          ROOM CHAT
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-500 italic select-none">
            Say hello to your opponent!
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.sender.id === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar name={msg.sender.avatar} size="sm" />
                <div className={`max-w-[70%] ${isMe ? 'text-right' : 'text-left'}`}>
                  <div className="text-[10px] font-semibold text-gray-500 mb-0.5 px-1">
                    {msg.sender.username}
                  </div>
                  <div
                    className={`text-xs px-3.5 py-2 rounded-2xl shadow-sm inline-block break-words ${
                      isMe
                        ? 'bg-violet-600 text-white rounded-br-none'
                        : 'bg-slate-800/80 text-gray-200 rounded-bl-none border border-slate-700/30'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {typingList.length > 0 && (
        <div className="px-4 py-1.5 text-[10px] text-violet-400 font-semibold italic bg-slate-900/10 transition-all select-none">
          {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-slate-950/20 flex gap-2">
        <Input
          placeholder="Type your message..."
          value={messageInput}
          onChange={handleInputChange}
          className="py-2.5 rounded-xl text-xs bg-slate-900/40 focus:border-violet-500/50"
        />
        <Button type="submit" variant="primary" className="p-2.5 rounded-xl shrink-0 cursor-pointer" size="sm">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

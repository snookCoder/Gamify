import React from 'react';

const AVATAR_MAP: Record<string, { emoji: string; bg: string }> = {
  avatar_1: { emoji: '🎮', bg: 'from-violet-500 to-purple-600' },
  avatar_2: { emoji: '👾', bg: 'from-cyan-400 to-blue-500' },
  avatar_3: { emoji: '🤖', bg: 'from-emerald-400 to-teal-500' },
  avatar_4: { emoji: '⚡', bg: 'from-amber-400 to-orange-500' },
  avatar_5: { emoji: '🦄', bg: 'from-pink-400 to-rose-500' },
  avatar_6: { emoji: '🦊', bg: 'from-orange-400 to-red-500' },
  avatar_7: { emoji: '🐼', bg: 'from-gray-400 to-slate-600' },
  avatar_8: { emoji: '🚀', bg: 'from-indigo-400 to-violet-600' },
};

export const Avatar: React.FC<{
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ name = 'avatar_1', size = 'md', className = '' }) => {
  const avatar = AVATAR_MAP[name] || AVATAR_MAP.avatar_1;

  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-24 h-24 text-5xl',
  };

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center font-bold text-white shadow-md select-none shrink-0 ${sizes[size]} ${className}`}
    >
      {avatar.emoji}
    </div>
  );
};

export const AVAILABLE_AVATARS = Object.keys(AVATAR_MAP);
export const getAvatarEmoji = (name: string) => AVATAR_MAP[name]?.emoji || '🎮';

'use client';

import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useGameStore } from '../store/useGameStore';
import { api } from '../services/api';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { LogOut, Trophy, Award, Coins, User as UserIcon, MessageSquare, Bell, BellOff, Check, X } from 'lucide-react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { socket, isConnected } = useGameStore();
  const [mounted, setMounted] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [requestsCount, setRequestsCount] = React.useState(0);
  const [pendingRequests, setPendingRequests] = React.useState<any[]>([]);

  const fetchNotificationCounts = async () => {
    try {
      const data = await api.chats.getConversations();
      const totalUnreads = data.reduce((acc: number, p: any) => acc + (p.unreadCount || 0), 0);
      const receivedRequests = data.filter((p: any) => p.requestReceived);
      setUnreadCount(totalUnreads);
      setPendingRequests(receivedRequests);
      setRequestsCount(receivedRequests.length);
    } catch (e) {
      console.error('Error fetching notification counts:', e);
    }
  };

  const handleClearAllNotifications = () => {
    if (socket && pendingRequests.length > 0) {
      pendingRequests.forEach((request) => {
        socket.emit('decline-friend-request', { targetUserId: request._id });
      });
      setPendingRequests([]);
      setRequestsCount(0);
    }
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchNotificationCounts();
    }
  }, [mounted, isAuthenticated]);

  React.useEffect(() => {
    if (socket && isConnected) {
      socket.on('friend-updated', fetchNotificationCounts);
      socket.on('private-msg', fetchNotificationCounts);

      return () => {
        socket.off('friend-updated', fetchNotificationCounts);
        socket.off('private-msg', fetchNotificationCounts);
      };
    }
  }, [socket, isConnected]);

  if (!mounted || !isAuthenticated || !user) return null;

  const currentXP = (user.wins * 10) + (user.draws * 3);
  const xpInCurrentLevel = currentXP % 50;

  return (
    <nav className="bg-[#07080c] border-b border-white/5 sticky top-0 z-50 px-4 md:px-6 py-3.5 md:py-3.5 flex items-center justify-between shadow-lg shadow-black/40">
      <Link href="/" className="flex items-center gap-2 select-none group shrink-0">
        <span className="flex bg-gradient-to-r from-violet-600 to-indigo-600 p-1.5 sm:p-2 rounded-lg text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200 text-xs sm:text-base">
          🎮
        </span>
        <span className="font-display font-extrabold text-base sm:text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-violet-400 group-hover:to-violet-300 transition-colors">
          PLAYVERSE
        </span>
      </Link>

      <div className="flex items-center gap-2.5 md:gap-4 ml-auto mr-2 md:mr-0 min-w-0">
        {/* Notification Bell Dropdown */}
        <div className="relative shrink-0 flex items-center">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
            }}
            className="relative p-2 rounded-xl bg-slate-950/40 border border-white/5 text-gray-400 hover:text-white hover:bg-slate-950/80 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Notifications"
          >
            <Bell className={`w-4 h-4 ${requestsCount > 0 ? 'text-amber-400 animate-pulse' : 'text-gray-400'}`} />
            
            {requestsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[8px] font-mono font-bold text-white border border-[#07080c] shadow-sm">
                {requestsCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div
                className="fixed right-4 top-16 w-80 z-50 bg-[#08090d]/98 border border-white/5 p-4 rounded-2xl shadow-2xl mt-2 flex flex-col gap-3.5
                           md:absolute md:top-full md:right-0 md:w-80 md:bg-[#08090d]"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="font-display font-extrabold text-[10px] uppercase tracking-wider text-gray-300">
                    Arena Notifications
                  </span>
                  {requestsCount > 0 ? (
                    <button
                      onClick={handleClearAllNotifications}
                      className="text-[9px] text-rose-455 hover:text-rose-400 font-extrabold font-mono uppercase tracking-wider cursor-pointer border border-rose-500/20 px-2 py-0.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/15 transition-all"
                    >
                      Clear All
                    </button>
                  ) : null}
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-white/5 pr-1 space-y-1">
                  {pendingRequests.length === 0 ? (
                    <div className="py-6 flex flex-col items-center justify-center text-center text-gray-500 text-xs italic">
                      <BellOff className="w-6 h-6 text-gray-700 mb-2" />
                      No pending friend requests.
                    </div>
                  ) : (
                    pendingRequests.map((request: any) => (
                      <div key={request._id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={request.avatar} size="sm" className="ring-1 ring-white/5 flex-shrink-0" />
                          <div className="min-w-0 leading-tight">
                            <div className="text-xs font-bold text-gray-200 truncate">{request.username}</div>
                            <div className="text-[9px] text-cyan-400 font-mono mt-0.5">Level {request.level}</div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              if (socket) socket.emit('accept-friend-request', { targetUserId: request._id });
                            }}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-450 hover:text-white border border-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                            title="Accept Request"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (socket) socket.emit('decline-friend-request', { targetUserId: request._id });
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-450 hover:text-white border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
                            title="Decline Request"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-white/5 pt-2 flex justify-center">
                  <Link
                    href="/chats"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider transition-colors"
                  >
                    Go to Chats Arena &rarr;
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative shrink-0 flex items-center">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
            }}
            className="relative flex items-center justify-center rounded-full shrink-0 cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md border border-violet-400/20 select-none uppercase shrink-0">
              {user.username.charAt(0)}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-[#07080c] rounded-full" />
          </button>

          {/* Profile Dropdown / Mobile Drawer */}
          {isProfileOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:bg-transparent md:backdrop-blur-none"
                onClick={() => setIsProfileOpen(false)}
              />
              <div
                className="fixed right-0 top-0 bottom-0 w-72 z-50 bg-[#08090d]/98 border-l border-white/5 p-6 shadow-2xl flex flex-col justify-between
                           md:absolute md:top-full md:right-0 md:bottom-auto md:w-64 md:border md:rounded-2xl md:mt-2 md:p-4.5 md:shadow-violet-500/5 md:bg-[#08090d]"
              >
                {/* Header info */}
                <div>
                  <div className="flex items-center justify-between md:hidden mb-4">
                    <span className="font-display font-extrabold text-sm uppercase tracking-wider text-gray-400">Profile Menu</span>
                    <button onClick={() => setIsProfileOpen(false)} className="text-gray-500 hover:text-white text-xs font-mono">CLOSE ✕</button>
                  </div>

                  <div className="flex items-center gap-3.5 mb-6 md:mb-4">
                    <Avatar name={user.avatar} size="md" className="border border-violet-500/20 shadow-lg shadow-violet-500/10" />
                    <div>
                      <div className="font-display font-extrabold text-gray-200 text-base leading-tight">{user.username}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 my-4" />

                  {/* Detailed Stats in Drawer */}
                  <div className="space-y-3 font-sans">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Rating:</span>
                      <span className="font-bold text-violet-400 font-mono">{user.rating} PTS</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Coins:</span>
                      <span className="font-bold text-amber-500 font-mono">🪙 {user.coins}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Level:</span>
                      <span className="font-bold text-cyan-400 font-mono">Lv. {user.level}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>XP Progress:</span>
                      <span className="font-bold text-gray-300 font-mono">{xpInCurrentLevel}/50 XP</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>W-D-L Record:</span>
                      <span className="font-bold text-gray-400 font-mono">{user.wins}W - {user.draws}D - {user.losses}L</span>
                    </div>
                  </div>
                </div>

                {/* Logout Action */}
                <div className="mt-8 md:mt-4">
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="gap-2 py-2 text-xs md:text-sm font-bold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

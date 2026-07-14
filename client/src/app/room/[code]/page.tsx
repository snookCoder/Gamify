'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/useAuthStore';
import { useGameStore } from '../../../store/useGameStore';
import { Navbar } from '../../../components/Navbar';
import { Chat } from '../../../components/Chat';
import { GameContainer } from '../../../components/GameContainer';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Shield, CheckCircle2, XCircle, Copy, LogOut, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { room, leaveRoom, toggleReady, startGame, isConnected, onlineUsers, sendInvite } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState<Record<string, boolean>>({});

  const handleInvite = (targetUserId: string) => {
    if (room) {
      sendInvite(targetUserId, room.id);
      setInvitedUserIds((prev) => ({ ...prev, [targetUserId]: true }));
      setTimeout(() => {
        setInvitedUserIds((prev) => ({ ...prev, [targetUserId]: false }));
      }, 4000);
    }
  };

  useEffect(() => {
    if (isConnected && !room) {
      router.push('/');
    }
  }, [room, router, isConnected]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  if (!room || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#06070a] relative overflow-hidden select-none">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full filter blur-[80px] pointer-events-none" />

        <div className="flex flex-col items-center z-10">
          <div className="relative flex items-center justify-center w-24 h-24 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-violet-500/40"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-2 rounded-full border-2 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            />
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-2xl flex items-center justify-center border border-violet-400/20 shadow-lg shadow-violet-500/20"
            >
              <Gamepad2 className="w-7 h-7 text-white" />
            </motion.div>
          </div>

          <motion.h1
            initial={{ letterSpacing: "0.2em", opacity: 0.7 }}
            animate={{ letterSpacing: "0.3em", opacity: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="font-display font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-white to-cyan-400 tracking-[0.25em] uppercase pl-[0.25em]"
          >
            PlayVerse
          </motion.h1>

          <motion.span
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.15em] mt-3 font-mono"
          >
            Syncing Arena Details...
          </motion.span>
        </div>
      </div>
    );
  }

  const isHost = room.hostId === user.id;
  const myPlayerInfo = room.players.find((p) => p.id === user.id);
  const guestPlayer = room.players[1];

  const copyInviteLink = () => {
    const link = `${window.location.origin}/room/${room.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    startGame();
  };

  const handleToggleReady = () => {
    if (myPlayerInfo) {
      toggleReady(!myPlayerInfo.isReady);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/5 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Room Code:
            </span>
            <span className="text-lg font-black text-violet-400 font-mono tracking-widest bg-slate-900/60 px-3.5 py-1 rounded-xl border border-violet-500/10">
              {room.id}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyInviteLink}
              className="p-2 min-w-0 cursor-pointer"
              title="Copy Link"
            >
              {copied ? (
                <span className="text-xs text-emerald-400 font-bold font-mono">Copied!</span>
              ) : (
                <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
              )}
            </Button>
          </div>

          <Button variant="danger" size="sm" onClick={handleLeaveRoom} className="gap-1.5 cursor-pointer">
            <LogOut className="w-4 h-4" /> Leave Room
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            {room.status === 'waiting' ? (
              <div className="glass-panel rounded-3xl p-8 flex flex-col items-center shadow-lg border border-white/5 relative min-h-[400px] justify-between">
                <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-6">
                  Matchmaking Lobby
                </h2>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-8 items-center flex-1 my-6">
                  <div className="flex flex-col items-center text-center p-6 bg-slate-950/20 border border-white/5 rounded-2xl">
                    <div className="relative">
                      <Avatar name={room.players[0]?.avatar} size="lg" />
                      <div className="absolute -top-1.5 -right-1.5 bg-violet-600 p-1.5 rounded-full text-white border border-[#090a0f]" title="Lobby Host">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-base text-gray-200 mt-3.5">
                      {room.players[0]?.username}
                    </h3>
                    <p className="text-xs text-gray-500 font-bold font-mono uppercase tracking-wider mt-0.5">
                      {room.players[0]?.rating} Pts
                    </p>
                    <span className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Host Ready
                    </span>
                  </div>

                  <div className="flex flex-col items-center text-center p-6 bg-slate-950/20 border border-white/5 rounded-2xl min-h-[240px] justify-center">
                    {guestPlayer ? (
                      <>
                        <Avatar name={guestPlayer.avatar} size="lg" />
                        <h3 className="font-display font-bold text-base text-gray-200 mt-3.5">
                          {guestPlayer.username}
                        </h3>
                        <p className="text-xs text-gray-500 font-bold font-mono uppercase tracking-wider mt-0.5">
                          {guestPlayer.rating} Pts
                        </p>
                        <span
                          className={`mt-4 flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                            guestPlayer.isReady
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}
                        >
                          {guestPlayer.isReady ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Waiting...
                            </>
                          )}
                        </span>
                      </>
                    ) : (
                      (() => {
                        const availableInvitees = onlineUsers.filter((u) => u._id !== user.id);
                        return (
                          <div className="w-full flex flex-col items-stretch text-left">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 text-center font-display">
                              Invite Online Players
                            </h3>
                            {availableInvitees.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-4 text-center">
                                <div className="w-12 h-12 rounded-full border border-dashed border-gray-800 flex items-center justify-center text-gray-650 animate-pulse text-sm font-black mb-3">
                                  ?
                                </div>
                                <h4 className="text-xs font-semibold text-gray-450">Waiting for Challenger...</h4>
                                <p className="text-[10px] text-gray-500 mt-1">
                                  No other players online right now.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                {availableInvitees.map((onlineUser) => {
                                  const isInvited = !!invitedUserIds[onlineUser._id];
                                  return (
                                    <div
                                      key={onlineUser._id}
                                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Avatar name={onlineUser.avatar} size="sm" />
                                        <div className="leading-tight">
                                          <div className="text-xs font-bold text-gray-200 truncate max-w-[85px]">
                                            {onlineUser.username}
                                          </div>
                                          <div className="text-[9px] text-violet-400 font-mono mt-0.5">
                                            {onlineUser.rating} Pts
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        variant={isInvited ? 'secondary' : 'outline'}
                                        size="sm"
                                        disabled={isInvited}
                                        onClick={() => handleInvite(onlineUser._id)}
                                        className="text-[9px] px-2.5 py-1 font-bold border-violet-500/20 text-violet-400 hover:bg-violet-600 hover:text-white shrink-0 cursor-pointer"
                                      >
                                        {isInvited ? 'Sent' : 'Invite'}
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

                <div className="w-full max-w-xs mt-6">
                  {isHost ? (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleStartGame}
                      disabled={room.players.length < 2 || !room.players.every((p) => p.isReady)}
                      className="py-3 text-sm animate-pulse-glow cursor-pointer"
                    >
                      START GAME
                    </Button>
                  ) : (
                    <Button
                      variant={myPlayerInfo?.isReady ? 'secondary' : 'primary'}
                      fullWidth
                      onClick={handleToggleReady}
                      className="py-3 text-sm cursor-pointer"
                    >
                      {myPlayerInfo?.isReady ? 'CANCEL READY' : 'SET READY'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl overflow-hidden shadow-lg border border-white/5 min-h-[400px]">
                <GameContainer />
              </div>
            )}
          </div>

          <div>
            <Chat />
          </div>
        </div>
      </main>
    </div>
  );
}

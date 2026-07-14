'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useGameStore } from '../../store/useGameStore';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar, AVAILABLE_AVATARS } from '../../components/ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { login, isAuthenticated, token } = useAuthStore();
  const { connectSocket } = useGameStore();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
      router.push('/');
    }
  }, [isAuthenticated, token, router, connectSocket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const data = await api.auth.login({ email, password });
        login(data.user, data.token);
        connectSocket(data.token);
      } else {
        const data = await api.auth.register({
          username,
          email,
          password,
          avatar: selectedAvatar,
        });
        login(data.user, data.token);
        connectSocket(data.token);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative min-h-screen">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-600/10 rounded-full filter blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full filter blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl glass-panel-glow-purple border border-white/5 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-3.5 rounded-2xl text-white shadow-xl shadow-violet-500/30 mb-3.5">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-wider text-white">
            PLAYVERSE
          </h1>
          <p className="text-gray-400 text-xs mt-1 text-center">
            {isLogin ? 'Welcome back, challenger!' : 'Create your account and jump in'}
          </p>
        </div>

        <div className="flex bg-slate-950/40 p-1.5 rounded-xl border border-white/5 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isLogin ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            LOGIN
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isLogin ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            REGISTER
          </button>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl p-3 mb-5 font-semibold text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <Input
                  id="username"
                  label="Username"
                  placeholder="alex_challenger"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                />
                
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Choose Avatar
                  </span>
                  <div className="grid grid-cols-4 gap-3 bg-slate-950/20 p-3 rounded-2xl border border-white/5">
                    {AVAILABLE_AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`flex items-center justify-center p-1 rounded-full border-2 transition-all cursor-pointer ${
                          selectedAvatar === av ? 'border-violet-500 scale-105 bg-violet-500/10' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Avatar name={av} size="sm" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            id="email"
            label={isLogin ? "Email or Username" : "Email Address"}
            placeholder={isLogin ? "challenger@playverse.com or alex" : "challenger@playverse.com"}
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Password"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" fullWidth className="py-3 text-sm cursor-pointer" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

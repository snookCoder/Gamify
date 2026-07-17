import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { roomManager } from './roomManager';
import { PrivateMessage } from '../models/PrivateMessage';
import { musicRoomManager } from './musicRoomManager';

const JWT_SECRET = process.env.JWT_SECRET || 'playverse-jwt-secret-key-123456';

const activeTimers: Map<string, NodeJS.Timeout> = new Map();

const startRoomTimer = (io: Server, roomCode: string) => {
  stopRoomTimer(roomCode);

  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  const timer = setInterval(async () => {
    const activeRoom = roomManager.getRoom(roomCode);
    if (!activeRoom || activeRoom.status !== 'playing') {
      stopRoomTimer(roomCode);
      return;
    }

    activeRoom.turnTimeLeft -= 1;
    io.to(`room_${roomCode}`).emit('timer-tick', { timeLeft: activeRoom.turnTimeLeft });

    if (activeRoom.turnTimeLeft <= 0) {
      stopRoomTimer(roomCode);

      if (activeRoom.game === 'guess-the-song') {
        const board = activeRoom.gameState?.board as any;
        if (!board) return;

        if (board.status === 'playing') {
          // Log a timeout (incorrect) for the current song round
          const currentIdx = board.currentSongIndex;
          if (board.phase === 'guessing_b') {
            const currentSong = board.songsB[currentIdx];
            if (currentSong && !board.guessesB[currentIdx]) {
              board.guessesB[currentIdx] = {
                songId: currentSong.id,
                isCorrect: false,
                timeTaken: 20000
              };
            }
          } else if (board.phase === 'guessing_a') {
            const currentSong = board.songsA[currentIdx];
            if (currentSong && !board.guessesA[currentIdx]) {
              board.guessesA[currentIdx] = {
                songId: currentSong.id,
                isCorrect: false,
                timeTaken: 20000
              };
            }
          }

          board.status = 'reveal';
          activeRoom.turnTimeLeft = 2; // 2 seconds reveal time
          io.to(`room_${roomCode}`).emit('room-updated', activeRoom);
          startRoomTimer(io, roomCode);
        } else if (board.status === 'reveal') {
          board.currentSongIndex += 1;

          if (board.currentSongIndex >= 5) {
            // End of current guessing phase
            if (board.phase === 'guessing_b') {
              // Transition to Phase 1.5: Guest curates challenge songs
              board.phase = 'lobby_a';
              board.status = 'playing';
              board.currentSongIndex = 0;
              
              activeRoom.turnTimeLeft = 0; // stop timer
              io.to(`room_${roomCode}`).emit('room-updated', activeRoom);
            } else if (board.phase === 'guessing_a') {
              // Finish game and calculate winner
              board.phase = 'finished';
              board.status = 'finished';
              activeRoom.status = 'gameover';
              activeRoom.gameState!.status = 'gameover';

              // Tally correct counts and times
              let correctB = 0;
              let timeB = 0;
              for (let i = 0; i < 5; i++) {
                const g = board.guessesB[i];
                if (g) {
                  if (g.isCorrect) correctB++;
                  timeB += g.timeTaken;
                } else {
                  timeB += 20000;
                }
              }

              let correctA = 0;
              let timeA = 0;
              for (let i = 0; i < 5; i++) {
                const g = board.guessesA[i];
                if (g) {
                  if (g.isCorrect) correctA++;
                  timeA += g.timeTaken;
                } else {
                  timeA += 20000;
                }
              }

              let winnerId: string | 'draw' = 'draw';
              if (correctB > correctA) {
                winnerId = board.guestId;
              } else if (correctA > correctB) {
                winnerId = board.hostId;
              } else {
                // Ties resolved by response speed
                if (timeB < timeA) {
                  winnerId = board.guestId;
                } else if (timeA < timeB) {
                  winnerId = board.hostId;
                } else {
                  winnerId = 'draw';
                }
              }

              activeRoom.gameState!.winner = winnerId;
              await roomManager.handleGameOver(activeRoom, winnerId);

              io.to(`room_${roomCode}`).emit('room-updated', activeRoom);
              io.to(`room_${roomCode}`).emit('game-over', {
                winner: winnerId,
                reason: 'ended',
              });
              io.emit('stats-updated');
              await broadcastUserProfileUpdates(io, activeRoom);
            }
          } else {
            // Move to next song round in the same phase
            board.status = 'playing';
            board.songStartTime = Date.now();
            board.previewStartOffset = Math.floor(Math.random() * 10);
            
            board.difficultyDuration = 20;
            activeRoom.turnTimeLeft = 20;

            io.to(`room_${roomCode}`).emit('room-updated', activeRoom);
            startRoomTimer(io, roomCode);
          }
        }
      } else {
        const updatedRoom = await roomManager.handleTimeout(roomCode);
        if (updatedRoom) {
          io.to(`room_${roomCode}`).emit('room-updated', updatedRoom);
          io.to(`room_${roomCode}`).emit('game-over', {
            winner: updatedRoom.gameState?.winner,
            reason: 'timeout',
          });
          io.emit('stats-updated');
          await broadcastUserProfileUpdates(io, updatedRoom);
        }
      }
    }
  }, 1000);

  activeTimers.set(roomCode, timer);
};

const stopRoomTimer = (roomCode: string) => {
  const timer = activeTimers.get(roomCode);
  if (timer) {
    clearInterval(timer);
    activeTimers.delete(roomCode);
  }
};

const broadcastOnlineUsers = async (io: Server) => {
  try {
    const onlineUsers = await User.find({ status: 'online' }).select('_id username avatar rating level coins status');
    io.emit('online-users', onlineUsers);
  } catch (err) {
    console.error('Error broadcasting online users:', err);
  }
};

const broadcastUserProfileUpdates = async (io: Server, room: any) => {
  for (const player of room.players) {
    try {
      const user = await User.findById(player.id).select('-password');
      if (user) {
        io.to(player.socketId).emit('profile-updated', user);
      }
    } catch (err) {
      console.error('Error broadcasting user profile updates:', err);
    }
  }
};

export const socketHandler = (io: Server) => {
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; email: string };
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user.username} (Socket: ${socket.id})`);

    try {
      user.status = 'online';
      await user.save();
      io.emit('presence-updated', { userId: user._id, status: 'online' });
      await broadcastOnlineUsers(io);
    } catch (err) {
      console.error(err);
    }

    socket.emit('public-rooms', roomManager.getPublicRooms());

    socket.on('refresh-lobby', async () => {
      socket.emit('public-rooms', roomManager.getPublicRooms());
      await broadcastOnlineUsers(io);
    });

    socket.on('create-room', async ({ game, isPrivate }) => {
      try {
        const dbUser = await User.findById(user._id);
        if (!dbUser || dbUser.coins < 50) {
          socket.emit('error', 'Insufficient Coins! You need at least 50 coins to play. 🪙');
          return;
        }
        const room = roomManager.createRoom(
          user._id.toString(),
          user.username,
          user.avatar,
          user.rating,
          socket.id,
          game,
          isPrivate
        );
        socket.join(`room_${room.id}`);
        socket.emit('room-created', room);
        
        if (!isPrivate) {
          io.emit('public-rooms', roomManager.getPublicRooms());
        }
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('join-room', async ({ roomCode }) => {
      try {
        const dbUser = await User.findById(user._id);
        if (!dbUser || dbUser.coins < 50) {
          socket.emit('error', 'Insufficient Coins! You need at least 50 coins to play. 🪙');
          return;
        }
        const room = roomManager.joinRoom(
          roomCode,
          user._id.toString(),
          user.username,
          user.avatar,
          user.rating,
          socket.id
        );
        socket.join(`room_${room.id}`);
        io.to(`room_${room.id}`).emit('room-updated', room);
        io.emit('public-rooms', roomManager.getPublicRooms());
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('ready-status', ({ isReady }) => {
      try {
        const room = roomManager.toggleReady(socket.id, isReady);
        io.to(`room_${room.id}`).emit('room-updated', room);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('start-game', async (settings) => {
      try {
        const room = await roomManager.startGame(socket.id, settings);
        io.to(`room_${room.id}`).emit('room-updated', room);
        io.to(`room_${room.id}`).emit('game-started', room);
        
        startRoomTimer(io, room.id);
        io.emit('public-rooms', roomManager.getPublicRooms());
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('make-move', async ({ move }) => {
      try {
        const room = await roomManager.handleMove(socket.id, move);
        io.to(`room_${room.id}`).emit('room-updated', room);

        if (room.status === 'gameover') {
          stopRoomTimer(room.id);
          io.to(`room_${room.id}`).emit('game-over', {
            winner: room.gameState?.winner,
            reason: 'ended',
          });
          io.emit('stats-updated');
          await broadcastUserProfileUpdates(io, room);
        } else {
          if (room.game === 'guess-the-song') {
            const board = room.gameState?.board as any;
            if (board) {
              if (board.status === 'reveal' && room.turnTimeLeft > 2) {
                room.turnTimeLeft = 2;
              }
              if (board.phase === 'guessing_a' && board.status === 'playing' && room.turnTimeLeft !== 20) {
                room.turnTimeLeft = 20;
              }
            }
          }
          startRoomTimer(io, room.id);
        }
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });    socket.on('play-again', async () => {
      try {
        const result = await roomManager.restartGame(socket.id);
        const room = result.room;
        io.to(`room_${room.id}`).emit('room-updated', room);
        
        if (result.startRematch) {
          io.to(`room_${room.id}`).emit('game-started', room);
          startRoomTimer(io, room.id);
        }
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('curation-progress', ({ count }) => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (room) {
        socket.to(`room_${room.id}`).emit('opponent-curation-progress', { count });
      }
    });
    socket.on('chat-message', ({ message }) => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (room) {
        const chatMsg = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sender: {
            id: user._id,
            username: user.username,
            avatar: user.avatar,
          },
          message,
          timestamp: new Date(),
        };
        io.to(`room_${room.id}`).emit('chat-message', chatMsg);
      }
    });

    socket.on('typing', ({ isTyping }) => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (room) {
        socket.to(`room_${room.id}`).emit('player-typing', {
          userId: user._id,
          username: user.username,
          isTyping,
        });
      }
    });

    socket.on('send-invite', async ({ targetUserId, roomCode }) => {
      try {
        const room = roomManager.getRoom(roomCode);
        if (!room) {
          throw new Error('Room not found');
        }

        const activeSockets = await io.fetchSockets();
        const targetSockets = activeSockets.filter(s => s.data.user?._id.toString() === targetUserId);

        if (targetSockets.length === 0) {
          socket.emit('error', 'Challenger is not online');
          return;
        }

        const invitePayload = {
          sender: {
            id: user._id.toString(),
            username: user.username,
            avatar: user.avatar,
            rating: user.rating,
          },
          roomCode,
          game: room.game,
        };

        for (const s of targetSockets) {
          s.emit('game-invite', invitePayload);
        }
        
        console.log(`Invite sent from ${user.username} to user ID ${targetUserId} for room ${roomCode}`);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    // Friend Requests & Actions
    socket.on('send-friend-request', async ({ targetUserId }) => {
      try {
        const currentUser = await User.findById(user._id);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
          socket.emit('error', 'User not found');
          return;
        }

        const currentIdStr = currentUser._id.toString();
        const targetIdStr = targetUser._id.toString();

        // Check if already friends or request already exists
        const isFriend = currentUser.friends.some(id => id.toString() === targetIdStr);
        const requestSent = currentUser.friendRequestsSent.some(id => id.toString() === targetIdStr);
        const requestReceived = currentUser.friendRequestsReceived.some(id => id.toString() === targetIdStr);

        if (isFriend || requestSent || requestReceived) {
          socket.emit('error', 'Friend request status already active');
          return;
        }

        currentUser.friendRequestsSent.push(targetUser._id as any);
        targetUser.friendRequestsReceived.push(currentUser._id as any);

        await currentUser.save();
        await targetUser.save();

        // Broadcast friend-updated to all sockets of both users
        const affectedUserIds = [currentIdStr, targetIdStr];
        Array.from(io.sockets.sockets.values()).forEach((s) => {
          if (s.data.user?._id && affectedUserIds.includes(s.data.user._id.toString())) {
            s.emit('friend-updated');
          }
        });
      } catch (err: any) {
        socket.emit('error', 'Failed to send friend request');
      }
    });

    socket.on('accept-friend-request', async ({ targetUserId }) => {
      try {
        const currentUser = await User.findById(user._id);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
          socket.emit('error', 'User not found');
          return;
        }

        const currentIdStr = currentUser._id.toString();
        const targetIdStr = targetUser._id.toString();

        // Remove from pending lists
        currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
          id => id.toString() !== targetIdStr
        );
        targetUser.friendRequestsSent = targetUser.friendRequestsSent.filter(
          id => id.toString() !== currentIdStr
        );

        // Add to friends lists (if not already there)
        if (!currentUser.friends.some(id => id.toString() === targetIdStr)) {
          currentUser.friends.push(targetUser._id as any);
        }
        if (!targetUser.friends.some(id => id.toString() === currentIdStr)) {
          targetUser.friends.push(currentUser._id as any);
        }

        await currentUser.save();
        await targetUser.save();

        // Broadcast friend-updated to all sockets of both users
        const affectedUserIds = [currentIdStr, targetIdStr];
        Array.from(io.sockets.sockets.values()).forEach((s) => {
          if (s.data.user?._id && affectedUserIds.includes(s.data.user._id.toString())) {
            s.emit('friend-updated');
          }
        });
      } catch (err: any) {
        socket.emit('error', 'Failed to accept friend request');
      }
    });

    socket.on('decline-friend-request', async ({ targetUserId }) => {
      try {
        const currentUser = await User.findById(user._id);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
          socket.emit('error', 'User not found');
          return;
        }

        const currentIdStr = currentUser._id.toString();
        const targetIdStr = targetUser._id.toString();

        // Remove from all pending request lists (covers both decline and cancel actions)
        currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
          id => id.toString() !== targetIdStr
        );
        currentUser.friendRequestsSent = currentUser.friendRequestsSent.filter(
          id => id.toString() !== targetIdStr
        );
        targetUser.friendRequestsReceived = targetUser.friendRequestsReceived.filter(
          id => id.toString() !== currentIdStr
        );
        targetUser.friendRequestsSent = targetUser.friendRequestsSent.filter(
          id => id.toString() !== currentIdStr
        );

        await currentUser.save();
        await targetUser.save();

        // Broadcast friend-updated to all sockets of both users
        const affectedUserIds = [currentIdStr, targetIdStr];
        Array.from(io.sockets.sockets.values()).forEach((s) => {
          if (s.data.user?._id && affectedUserIds.includes(s.data.user._id.toString())) {
            s.emit('friend-updated');
          }
        });
      } catch (err: any) {
        socket.emit('error', 'Failed to update friend request');
      }
    });

    // Private message handling
    socket.on('send-private-msg', async ({ toUserId, message, type, mediaUrl, duration }) => {
      try {
        // Enforce friendship validation
        const dbUser = await User.findById(user._id).select('friends').lean();
        const friendsList = (dbUser?.friends || []).map(id => id.toString());
        if (!friendsList.includes(toUserId)) {
          socket.emit('error', 'You can only message accepted friends.');
          return;
        }

        // Save to MongoDB
        const dbMsg = await PrivateMessage.create({
          senderId: user._id,
          recipientId: toUserId,
          message,
          type: type || 'text',
          mediaUrl,
          duration,
          isRead: false
        });

        const recipientSockets = Array.from(io.sockets.sockets.values()).filter(
          (s) => s.data.user?._id.toString() === toUserId
        );

        const msgPayload = {
          id: dbMsg._id.toString(),
          fromUserId: user._id.toString(),
          fromUsername: user.username,
          fromAvatar: user.avatar,
          toUserId,
          message,
          type: type || 'text',
          mediaUrl,
          duration,
          timestamp: dbMsg.createdAt.toISOString()
        };

        recipientSockets.forEach((s) => {
          s.emit('private-msg', msgPayload);
        });

        // Also emit back to the sender in case they have other sockets/tabs open
        const senderSockets = Array.from(io.sockets.sockets.values()).filter(
          (s) => s.data.user?._id.toString() === user._id.toString() && s.id !== socket.id
        );
        senderSockets.forEach((s) => {
          s.emit('private-msg', msgPayload);
        });
      } catch (err: any) {
        socket.emit('error', 'Failed to send private message');
      }
    });

    // Private typing status
    socket.on('send-private-typing', ({ toUserId, isTyping }) => {
      const recipientSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => s.data.user?._id.toString() === toUserId
      );
      recipientSockets.forEach((s) => {
        s.emit('private-typing', {
          fromUserId: user._id.toString(),
          isTyping
        });
      });
    });

    // Call signaling (WebRTC / Mock call states)
    socket.on('call-user', async ({ toUserId, offer }) => {
      // Enforce friendship validation for calls
      const dbUser = await User.findById(user._id).select('friends').lean();
      const friendsList = (dbUser?.friends || []).map(id => id.toString());
      if (!friendsList.includes(toUserId)) {
        socket.emit('error', 'You can only call accepted friends.');
        return;
      }

      const recipientSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => s.data.user?._id.toString() === toUserId
      );
      recipientSockets.forEach((s) => {
        s.emit('incoming-call', {
          fromUserId: user._id.toString(),
          fromUsername: user.username,
          fromAvatar: user.avatar,
          offer
        });
      });
    });

    socket.on('answer-call', ({ toUserId, answer }) => {
      const recipientSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => s.data.user?._id.toString() === toUserId
      );
      recipientSockets.forEach((s) => {
        s.emit('call-accepted', {
          fromUserId: user._id.toString(),
          answer
        });
      });
    });

    socket.on('ice-candidate', ({ toUserId, candidate }) => {
      const recipientSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => s.data.user?._id.toString() === toUserId
      );
      recipientSockets.forEach((s) => {
        s.emit('ice-candidate', {
          fromUserId: user._id.toString(),
          candidate
        });
      });
    });

    socket.on('hangup-call', ({ toUserId }) => {
      const recipientSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => s.data.user?._id.toString() === toUserId
      );
      recipientSockets.forEach((s) => {
        s.emit('call-hungup', {
          fromUserId: user._id.toString()
        });
      });
    });

    socket.on('reject-call', ({ toUserId }) => {
      const recipientSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => s.data.user?._id.toString() === toUserId
      );
      recipientSockets.forEach((s) => {
        s.emit('call-rejected', {
          fromUserId: user._id.toString()
        });
      });
    });

    // --- Music Room Socket Event Listeners ---
    socket.on('music-room:create', ({ roomName, maxParticipants, isPrivate }) => {
      try {
        const room = musicRoomManager.createRoom(
          user._id.toString(),
          user.username,
          user.avatar,
          user.rating,
          socket.id,
          roomName,
          maxParticipants,
          isPrivate
        );
        socket.join(`music_room_${room.id}`);
        socket.emit('music-room:created', room);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('music-room:join', ({ roomCode }) => {
      try {
        const room = musicRoomManager.joinRoom(
          roomCode,
          user._id.toString(),
          user.username,
          user.avatar,
          user.rating,
          socket.id
        );
        socket.join(`music_room_${room.id}`);
        io.to(`music_room_${room.id}`).emit('music-room:updated', room);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('music-room:leave', () => {
      handleUserLeaving(io, socket);
    });

    socket.on('music-room:action', ({ action, progress, song }) => {
      try {
        const room = musicRoomManager.syncPlayback(
          socket.id,
          action,
          progress,
          song,
          user.username
        );
        io.to(`music_room_${room.id}`).emit('music-room:updated', room);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('music-room:queue-update', ({ actionType, data }) => {
      try {
        const room = musicRoomManager.updateQueue(
          socket.id,
          actionType,
          data,
          user.username
        );
        io.to(`music_room_${room.id}`).emit('music-room:updated', room);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('music-room:chat-message', ({ message }) => {
      try {
        const room = musicRoomManager.addChatMessage(
          socket.id,
          message,
          {
            id: user._id.toString(),
            username: user.username,
            avatar: user.avatar
          }
        );
        io.to(`music_room_${room.id}`).emit('music-room:updated', room);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('music-room:transfer-host', ({ targetPlayerId }) => {
      try {
        const room = musicRoomManager.transferHost(
          socket.id,
          targetPlayerId,
          user.username
        );
        io.to(`music_room_${room.id}`).emit('music-room:updated', room);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('music-room:toggle-control', ({ allow }) => {
      try {
        const room = musicRoomManager.toggleEveryoneControl(
          socket.id,
          allow,
          user.username
        );
        io.to(`music_room_${room.id}`).emit('music-room:updated', room);
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('leave-room', () => {
      handleUserLeaving(io, socket);
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${user.username} (Socket: ${socket.id})`);
      handleUserLeaving(io, socket);

      setTimeout(async () => {
        try {
          const sockets = await io.fetchSockets();
          const isStillConnected = sockets.some((s) => s.data.user?._id.toString() === user._id.toString());
          
          if (!isStillConnected) {
            const activeUser = await User.findById(user._id);
            if (activeUser) {
              activeUser.status = 'offline';
              await activeUser.save();
              io.emit('presence-updated', { userId: user._id, status: 'offline' });
              await broadcastOnlineUsers(io);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }, 5000);
    });
  });
};

const handleUserLeaving = async (io: Server, socket: Socket) => {
  const result = roomManager.leaveRoom(socket.id);
  if (result) {
    const { roomCode, room, wasDeleted } = result;
    socket.leave(`room_${roomCode}`);

    if (wasDeleted) {
      stopRoomTimer(roomCode);
    } else if (room) {
      socket.to(`room_${roomCode}`).emit('room-updated', room);
      if (room.status === 'gameover') {
        stopRoomTimer(roomCode);
        socket.to(`room_${roomCode}`).emit('game-over', {
          winner: room.gameState?.winner,
          reason: 'forfeit',
        });
        await broadcastUserProfileUpdates(io, room);
      }
    }
    socket.broadcast.emit('public-rooms', roomManager.getPublicRooms());
  }

  // Handle music room leaving
  const musicResult = musicRoomManager.leaveRoom(socket.id);
  if (musicResult) {
    const { roomCode, room, wasDeleted } = musicResult;
    socket.leave(`music_room_${roomCode}`);
    if (!wasDeleted && room) {
      io.to(`music_room_${roomCode}`).emit('music-room:updated', room);
    }
  }
};

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { roomManager } from './roomManager';

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

    socket.on('start-game', () => {
      try {
        const room = roomManager.startGame(socket.id);
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
          startRoomTimer(io, room.id);
        }
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('play-again', () => {
      try {
        const result = roomManager.restartGame(socket.id);
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
};

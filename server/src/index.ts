import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { socketHandler } from './socket/socketHandler';
import { User } from './models/User';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'PlayVerse Backend Server is running!' });
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

socketHandler(io);

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  try {
    await User.updateMany({}, { status: 'offline' });
    console.log('Reset all user statuses to offline.');
  } catch (err) {
    console.error('Failed to reset user statuses:', err);
  }
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to database', err);
});

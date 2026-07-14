import { Response } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'playverse-jwt-secret-key-123456';

const generateToken = (id: string, username: string, email: string) => {
  return jwt.sign({ id, username, email }, JWT_SECRET, { expiresIn: '7d' });
};

export const register = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { username, email, password, avatar } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    // Check if username already exists
    const userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Check if email already exists
    const userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Determine avatar - if none provided, pick random
    const avatarList = ['avatar_1', 'avatar_2', 'avatar_3', 'avatar_4', 'avatar_5', 'avatar_6', 'avatar_7', 'avatar_8'];
    const finalAvatar = avatar || avatarList[Math.floor(Math.random() * avatarList.length)];

    // Create user
    const user = new User({
      username,
      email,
      password,
      avatar: finalAvatar,
    });

    await user.save();

    const token = generateToken(user._id.toString(), user.username, user.email);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        rating: user.rating,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        level: user.level,
        coins: user.coins,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: email }],
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString(), user.username, user.email);

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        rating: user.rating,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        level: user.level,
        coins: user.coins,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error: any) {
    console.error('getMe error:', error);
    return res.status(500).json({ message: 'Server error fetching profile' });
  }
};

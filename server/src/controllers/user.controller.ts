import { Response } from 'express';
import { User } from '../models/User';
import { Match } from '../models/Match';
import { AuthRequest } from '../middleware/auth.middleware';

export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const leaderboard = await User.find()
      .sort({ rating: -1 })
      .limit(20)
      .select('username avatar rating wins losses draws level');

    return res.json(leaderboard);
  } catch (error: any) {
    console.error('getLeaderboard error:', error);
    return res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
};

export const getMatchHistory = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.params.userId || req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const matches = await Match.find({ players: userId })
      .sort({ createdAt: -1 })
      .populate('players', 'username avatar rating')
      .populate('winner', 'username');

    return res.json(matches);
  } catch (error: any) {
    console.error('getMatchHistory error:', error);
    return res.status(500).json({ message: 'Server error fetching match history' });
  }
};

export const updateAvatar = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ message: 'Avatar selection is required' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatar;
    await user.save();

    return res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar,
    });
  } catch (error: any) {
    console.error('updateAvatar error:', error);
    return res.status(500).json({ message: 'Server error updating avatar' });
  }
};

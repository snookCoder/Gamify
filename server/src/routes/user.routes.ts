import { Router } from 'express';
import { getLeaderboard, getMatchHistory, updateAvatar } from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/history', verifyToken as any, getMatchHistory);
router.get('/history/:userId', verifyToken as any, getMatchHistory);
router.put('/avatar', verifyToken as any, updateAvatar);

export default router;

import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { PrivateMessage } from '../models/PrivateMessage';

const router = Router();

// Get all conversation partners alongside their last message and unread counts
router.get('/conversations', verifyToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Fetch current user's friends and request lists
    const currentUser = await User.findById(currentUserId)
      .select('friends friendRequestsSent friendRequestsReceived')
      .lean();

    const friends = (currentUser?.friends || []).map(id => id.toString());
    const friendRequestsSent = (currentUser?.friendRequestsSent || []).map(id => id.toString());
    const friendRequestsReceived = (currentUser?.friendRequestsReceived || []).map(id => id.toString());

    // Fetch all users in the system (excluding ourselves)
    const allUsers = await User.find({ _id: { $ne: currentUserId } })
      .select('_id username avatar rating level status')
      .lean();

    const conversations = await Promise.all(
      allUsers.map(async (otherUser) => {
        const otherUserIdStr = otherUser._id.toString();
        const isFriend = friends.includes(otherUserIdStr);
        const requestSent = friendRequestsSent.includes(otherUserIdStr);
        const requestReceived = friendRequestsReceived.includes(otherUserIdStr);

        let lastMsg = null;
        let unreadCount = 0;

        if (isFriend) {
          // Find last message exchanged
          lastMsg = await PrivateMessage.findOne({
            $or: [
              { senderId: currentUserId, recipientId: otherUser._id },
              { senderId: otherUser._id, recipientId: currentUserId }
            ]
          })
            .sort({ createdAt: -1 })
            .lean();

          // Count unread messages from this user to me
          unreadCount = await PrivateMessage.countDocuments({
            senderId: otherUser._id,
            recipientId: currentUserId,
            isRead: false
          });
        }

        return {
          ...otherUser,
          isFriend,
          requestSent,
          requestReceived,
          lastMessage: lastMsg || null,
          unreadCount
        };
      })
    );

    // Sort conversations: those with messages first (most recent message first), then others
    conversations.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    res.json(conversations);
  } catch (err: any) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

// Get chat history with a specific partner
router.get('/history/:partnerId', verifyToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const partnerId = req.params.partnerId as string;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verify friendship status before showing history
    const currentUser = await User.findById(currentUserId).select('friends').lean();
    const friends = (currentUser?.friends || []).map(id => id.toString());
    if (!friends.includes(partnerId)) {
      return res.status(403).json({ message: 'You must be friends with this user to view history' });
    }

    const messages = await PrivateMessage.find({
      $or: [
        { senderId: currentUserId, recipientId: partnerId },
        { senderId: partnerId, recipientId: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .lean();

    // Map messages format to match client expectations
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      fromUserId: msg.senderId.toString(),
      toUserId: msg.recipientId.toString(),
      message: msg.message,
      type: msg.type,
      mediaUrl: msg.mediaUrl,
      duration: msg.duration,
      isRead: msg.isRead,
      timestamp: msg.createdAt.toISOString()
    }));

    res.json(formattedMessages);
  } catch (err: any) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ message: 'Server error fetching chat history' });
  }
});

// Mark messages from partner as read
router.put('/read/:partnerId', verifyToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const { partnerId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await PrivateMessage.updateMany(
      { senderId: partnerId, recipientId: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ message: 'Server error marking messages as read' });
  }
});

export default router;

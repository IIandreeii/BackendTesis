import express from 'express'
const router = express.Router();
import Message from '../models/message.js';

router.get('/',(req, res)=>{
    res.send('<h1>Esto es la pagina principal </h1>')
});




router.get('/messages', async (req, res) => {
    const { receiverId, senderId } = req.query;
    try {
      const messages = await Message.find({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }).sort({ createdAt: 1 });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching messages' });
    }
  });
  
  router.get('/chats', async (req, res) => {
    const userId = req.query.userId;
    try {
      const chats = await Chat.find({ participants: userId })
        .populate('participants', 'nombre apellido avatar isActive')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });
  
      const chatPreviews = chats.map(chat => {
        const otherParticipant = chat.participants.find(participant => participant._id.toString() !== userId);
        return {
          id: chat._id,
          name: `${otherParticipant.nombre} ${otherParticipant.apellido}`,
          avatar: otherParticipant.avatar,
          lastMessage: chat.lastMessage ? chat.lastMessage.text : '',
          time: chat.lastMessage ? chat.lastMessage.createdAt : chat.updatedAt,
          unread: chat.unreadMessages.get(userId) || 0,
          isActive: otherParticipant.isActive,
        };
      });
  
      res.json(chatPreviews);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching chats' });
    }
  });



  




export default router;



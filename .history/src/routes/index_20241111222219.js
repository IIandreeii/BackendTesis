import express from 'express'
const router = express.Router();
import Message from '../models/message.js';

router.get('/',(req, res)=>{
    res.send('<h1>Esto es la pagina principal </h1>')
});



import Message from '../models/message.js';

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

export default router;



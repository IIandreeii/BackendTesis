import express from "express";
const router = express.Router();
import Message from "../models/message.js";
import mongoose from 'mongoose';
import Chat from "../models/chats.js"; // Asegúrate de que esta ruta sea correcta

router.get("/", (req, res) => {
  res.send("<h1>Esto es la pagina principal </h1>");
});

router.get('/chats', async (req, res) => {
  const { userId } = req.query;

  // Validación del ID
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  try {
    // Convertir userId a ObjectId
    const userObjectId = mongoose.Types.ObjectId(userId);

    // Buscar chats donde el userId esté presente en el array de participants
    const chats = await Chat.find({
      participants: { $in: [userObjectId] }  // Asegura que el userId esté en el array de participantes
    })
      .populate('participants', 'nombre avatar isActive')  // Popula la información de los participantes
      .populate('lastMessage')  // Popula el último mensaje
      .sort({ updatedAt: -1 });  // Ordena por la fecha de actualización

    const chatPreviews = chats.map(chat => {
      // Encuentra el otro participante que no sea el userId actual
      const otherParticipant = chat.participants.find(participant => participant._id.toString() !== userObjectId.toString());
      
      return {
        id: chat._id,
        name: `${otherParticipant.nombre}`,
        avatar: otherParticipant.avatar,
        lastMessage: chat.lastMessage ? chat.lastMessage.text : '',
        time: chat.lastMessage ? chat.lastMessage.createdAt : chat.updatedAt,
        unread: chat.unreadMessages.get(userObjectId.toString()) || 0,
        isActive: otherParticipant.isActive,
      };
    });

    res.json(chatPreviews);
  } catch (error) {
    console.error(error);  // Imprime el error para diagnóstico
    res.status(500).json({ error: 'Error fetching chats' });
  }
});





router.get("/messages", async (req, res) => {
  const { receiverId, senderId } = req.query;
  try {
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Error fetching messages" });
  }
});



router.post('/chats', async (req, res) => {
  const { userId, receiverId } = req.body;
  try {
    // Verifica si ya existe un chat entre estos dos usuarios
    let chat = await Chat.findOne({
      participants: { $all: [userId, receiverId] }
    });

    if (!chat) {
      // Si no existe, crea un nuevo chat
      chat = new Chat({
        participants: [userId, receiverId],
        lastMessage: null,
        unreadMessages: new Map([[userId, 0], [receiverId, 0]])
      });
      await chat.save();
    }

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating or fetching chat:', error);
    res.status(500).json({ error: 'Error creating or fetching chat' });
  }
});

export default router;
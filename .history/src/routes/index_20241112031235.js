import express from "express";
const router = express.Router();
import Message from "../models/message.js";
import mongoose from 'mongoose';
import Chat from "../models/chats.js"; 
import User from '../models/user.js';  
import Charity from '../models/charity.js';  

router.get("/", (req, res) => {
  res.send("<h1>Esto es la página principal</h1>");
});

router.get('/chats', async (req, res) => {
  const { userId } = req.query;

  try {
    const chats = await Chat.find({
      participants: userId  // Buscamos chats donde el `userId` es uno de los participantes
    });

    // Para cada chat, realizamos un `populate` condicional
    const chatDetails = await Promise.all(chats.map(async (chat) => {
      let participantNames = [];

      // Poblar participantes de tipo User
      const users = await User.find({ _id: { $in: chat.participants } }).select('nombre');
      participantNames = participantNames.concat(users.map(user => ({ id: user._id, name: user.nombre })));

      // Poblar participantes de tipo Charity
      const charities = await Charity.find({ _id: { $in: chat.participants } }).select('nombre');
      participantNames = participantNames.concat(charities.map(charity => ({ id: charity._id, name: charity.nombre })));

      return {
        id: chat._id,
        participants: participantNames,  // Lista de participantes con sus nombres
        lastMessage: chat.lastMessage || '',
        time: chat.updatedAt,
        unread: chat.unreadMessages.get(userId) || 0,  // Número de mensajes no leídos
      };
    }));

    res.json(chatDetails);  // Devolvemos los detalles del chat
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Error fetching chats' });
  }
});

router.get('/messages', async (req, res) => {
  const { receiverId, senderId } = req.query;

  if (!receiverId || !senderId) {
    return res.status(400).json({ error: 'ReceiverId and SenderId are required' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

router.post('/chats', async (req, res) => {
  const { userId, receiverId, userType, receiverType } = req.body;

  try {
    // Verifica si ya existe un chat entre estos dos usuarios
    let chat = await Chat.findOne({
      participants: { $all: [userId, receiverId] },
      participantsType: { $all: [userType, receiverType] }
    });

    if (!chat) {
      // Si no existe, creamos un nuevo chat
      chat = new Chat({
        participants: [userId, receiverId],
        participantsType: [userType, receiverType],
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

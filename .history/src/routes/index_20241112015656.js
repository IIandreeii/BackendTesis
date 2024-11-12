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
    })
    .populate({
      path: 'participants',
      match: { _id: userId },
      select: 'nombre'  // Seleccionamos solo el campo `nombre` de los participantes
    })
    .exec();

    const chatDetails = chats.map(chat => {
      const participantNames = chat.participants.map(participant => {
        return { id: participant._id, name: participant.nombre }; // Extraemos el nombre de los participantes
      });

      return {
        id: chat._id,
        name: participantNames.map(participant => participant.name).join(', '), // Combinamos los nombres de los participantes
        lastMessage: chat.lastMessage || '',
        time: chat.updatedAt,
        unread: chat.unreadMessages.get(userId) || 0, // Número de mensajes no leídos
      };
    });

    res.json(chatDetails);  // Devolvemos los detalles del chat
  } catch (error) {
    console.error('Error fetching chats:', error);
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

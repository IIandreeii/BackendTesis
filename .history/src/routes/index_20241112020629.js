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
      participants: userId  // Busca chats donde el `userId` es uno de los participantes
    })
    .populate({
      path: 'participants',
      model: [User, Charity],  // Asegúrate de poblar tanto a `User` como a `Charity`
      select: 'nombre'  // Selecciona solo el campo `nombre` del participante
    })
    .exec();

    const chatDetails = chats.map(chat => {
      // Filtra los participantes y obtiene el nombre solo del que corresponde al `userId`
      const participantNames = chat.participants.filter(participant => participant._id.toString() === userId)
        .map(participant => participant.nombre);  // Solo toma el nombre del usuario específico

      return {
        id: chat._id,
        name: participantNames.join(', '),  // Si solo hay un nombre, se devolverá ese
        lastMessage: chat.lastMessage || '',
        time: chat.updatedAt,
        unread: chat.unreadMessages.get(userId) || 0,  // Si es un mensaje no leído para el usuario
      };
    });

    res.json(chatDetails);
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

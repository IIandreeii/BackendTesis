import express from "express";
const router = express.Router();
import Message from "../models/message.js";
import mongoose from 'mongoose';
import Chat from "../models/chats.js"; // Asegúrate de que esta ruta sea correcta
import User from '../models/user.js';  // Ajusta la ruta según la estructura de tu proyecto
import Charity from '../models/charity.js';  // Ajusta la ruta según la estructura de tu proyecto

router.get("/", (req, res) => {
  res.send("<h1>Esto es la pagina principal </h1>");
});

router.get('/chats', async (req, res) => {
  const { userId } = req.query;

  try {
    const chats = await Chat.find({
      participants: userId  // Busca chats donde el `userId` es uno de los participantes
    });

    const chatDetails = [];

    for (const chat of chats) {
      const participantNames = [];

      for (const participantId of chat.participants) {
        // Verificar el tipo del participante y poblar el nombre según el tipo
        let participant;
        if (chat.participantsType.includes('user') && participantId.equals(userId)) {
          participant = await User.findById(participantId, 'nombre');  // Pobla con nombre solo
        } else if (chat.participantsType.includes('charity') && participantId.equals(userId)) {
          participant = await Charity.findById(participantId, 'nombre');
        }
        if (participant) {
          participantNames.push(participant.nombre);
        }
      }

      chatDetails.push({
        id: chat._id,
        name: participantNames.join(', '),  // Combinamos los nombres de los participantes
        lastMessage: chat.lastMessage || '',
        time: chat.updatedAt,
        unread: chat.unreadMessages.get(userId) || 0,  // Si es un mensaje no leído para el usuario
      });
    }

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
    // Verifica si ya existe un chat entre estos dos usuarios (usuario o organización benéfica)
    let chat = await Chat.findOne({
      participants: { $all: [userId, receiverId] },
      participantsType: { $all: [userType, receiverType] }  // Filtra por tipo de usuario
    });

    if (!chat) {
      // Si no existe, crea un nuevo chat
      chat = new Chat({
        participants: [userId, receiverId],  // Agrega los usuarios a los participantes
        participantsType: [userType, receiverType],  // Define los tipos de los participantes
        lastMessage: null,
        unreadMessages: new Map([[userId, 0], [receiverId, 0]])  // Inicializa los mensajes no leídos
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

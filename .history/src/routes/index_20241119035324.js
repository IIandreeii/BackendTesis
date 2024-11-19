import express from "express";
const router = express.Router();
import Message from "../models/message.js";
import mongoose from 'mongoose';
import Chat from "../models/chats.js"; 
import User from '../models/user.js';  
import Charity from '../models/charity.js';  
import upload  from '../services/multerconfig.js';
import Publication from '../models/publication.js';

router.get('/', async (req, res) => {
  
  try {
    const publications = await Publication.find().populate('charity', 'nombre');
    res.status(200).json(publications);
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ error: 'Error fetching publications' });
  }
});

router.get('/comments/:publicationId', async (req, res) => {
  const { publicationId } = req.params;

  try {
    const publication = await Publication.findById(publicationId).populate({
      path: 'comments',
      populate: [
        {
          path: 'user',
          select: 'nombre apellido' // Ajusta esto según los campos que quieras devolver del usuario
        },
        {
          path: 'charity',
          select: 'nombre' // Ajusta esto según los campos que quieras devolver de la organización
        }
      ]
    });
    if (!publication) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    res.status(200).json(publication.comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Error fetching comments' });
  }
});





router.get('/chats', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

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

router.post('/messages', async (req, res) => {
  const { content, senderId, receiverId, chatId } = req.body;

  if (!content || !senderId || !receiverId || !chatId) {
    return res.status(400).json({ error: 'Content, senderId, receiverId, and chatId are required' });
  }

  try {
    const message = new Message({
      content,
      senderId,
      receiverId,
      chatId,
      createdAt: new Date()
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Error saving message' });
  }
});

router.get('/messages', async (req, res) => {
  const { chatId } = req.query;

  // Validación de chatId
  if (!chatId) {
    return res.status(400).json({ error: 'chatId is required' });
  }

  if (!mongoose.isValidObjectId(chatId)) {
    return res.status(400).json({ error: 'Invalid chatId format' });
  }

  try {
    // Buscar mensajes por chatId
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    // Verificar si se encontraron mensajes
    if (messages.length === 0) {
      return res.status(404).json({ error: 'No messages found for this chatId' });
    }

    // Responder con los mensajes encontrados
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

router.post('/chats', async (req, res) => {
  const { userId, receiverId, userType, receiverType } = req.body;

  if (!userId || !receiverId || !userType || !receiverType) {
    return res.status(400).json({ error: 'userId, receiverId, userType, and receiverType are required' });
  }

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


router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.status(200).json({ imageUrl: `/public/imagenes/${req.file.filename}` });
});

export default router;
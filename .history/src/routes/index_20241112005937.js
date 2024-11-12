import express from "express";
const router = express.Router();
import Message from "../models/message.js";
import mongoose from 'mongoose';
import Chat from "../models/chats.js"; // Asegúrate de que esta ruta sea correcta

router.get("/", (req, res) => {
  res.send("<h1>Esto es la pagina principal </h1>");
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
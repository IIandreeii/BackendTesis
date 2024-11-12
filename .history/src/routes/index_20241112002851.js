// FILE: src/routes/index.js

import express from "express";
const router = express.Router();
import Message from "../models/message.js";
import Chat from "../models/chats.js"; // Asegúrate de que esta ruta sea correcta

// Ruta principal
router.get("/", (req, res) => {
    res.send("<h1>Esto es la pagina principal</h1>");
});

// Ruta para obtener los mensajes entre dos usuarios
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

// Ruta para obtener los chats de un usuario
router.get('/chats', async (req, res) => {
    const { userId } = req.query;
    try {
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'nombre avatar isActive')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        const chatPreviews = chats.map(chat => {
            const otherParticipant = chat.participants.find(participant => participant._id.toString() !== userId);
            const lastMessage = chat.lastMessage ? chat.lastMessage.text : "No messages yet";
            const time = chat.lastMessage ? chat.lastMessage.createdAt : null;

            return {
                id: chat._id,
                name: otherParticipant.nombre,
                avatar: otherParticipant.avatar,
                isActive: otherParticipant.isActive,
                lastMessage,
                time: time ? new Date(time).toLocaleTimeString() : '',
                unread: chat.unreadCount || 0,
            };
        });

        res.json(chatPreviews);
    } catch (error) {
        res.status(500).json({ error: "Error fetching chats" });
    }
});

// Ruta para crear un nuevo chat
router.post("/chats", async (req, res) => {
    const { userId, receiverId } = req.body;
    try {
        const newChat = new Chat({
            participants: [userId, receiverId],
        });

        await newChat.save();
        res.status(201).json(newChat);
    } catch (error) {
        res.status(500).json({ error: "Error creating chat" });
    }
});

export default router;

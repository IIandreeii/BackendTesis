import express from "express";
const router = express.Router();
import Message from "../models/message.js";
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

router.get('/chats', async (req, res) => {
  const { userId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  try {
    // Convertir userId a ObjectId
    const userObjectId = mongoose.Types.ObjectId(userId);

    // Realizar la consulta, asegurándonos de que el userId esté presente en el array de participantes
    const chats = await Chat.find({ participants: userObjectId })
      .populate('participants', 'nombre avatar isActive')  // Asegúrate que 'nombre' y 'avatar' existan en tu esquema de User
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    const chatPreviews = chats.map(chat => {
      // Encontrar al otro participante que no sea el userId actual
      const otherParticipant = chat.participants.find(participant => participant._id.toString() !== userObjectId.toString());
      return {
        id: chat._id,
        name: `${otherParticipant.nombre}`,
        avatar: otherParticipant.avatar,
        lastMessage: chat.lastMessage ? chat.lastMessage.text : '',
        time: chat.lastMessage ? chat.lastMessage.createdAt : chat.updatedAt,
        unread: chat.unreadMessages.get(userObjectId.toString()) || 0,  // Asegurarse que el `userObjectId` sea de tipo string
        isActive: otherParticipant.isActive,
      };
    });

    res.json(chatPreviews);
  } catch (error) {
    console.error(error); // Log del error para mayor detalle
    res.status(500).json({ error: 'Error fetching chats' });
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
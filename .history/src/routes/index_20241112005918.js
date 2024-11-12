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

file:///C:/Users/ANDREE/Documents/drive-download-20240927T200830Z-001/Proyecto-tesis/Proyecto-tesis/Proyecto-tesis/src/routes/index.js:28
  if (!mongoose.Types.ObjectId.isValid(userId)) {
  ^

ReferenceError: mongoose is not defined
    at file:///C:/Users/ANDREE/Documents/drive-download-20240927T200830Z-001/Proyecto-tesis/Proyecto-tesis/Proyecto-tesis/src/routes/index.js:28:3
    at Layer.handle [as handle_request] (C:\Users\ANDREE\Documents\drive-download-20240927T200830Z-001\Proyecto-tesis\Proyecto-tesis\Proyecto-tesis\node_modules\express\lib\router\layer.js:95:5)
    at next (C:\Users\ANDREE\Documents\drive-download-20240927T200830Z-001\Proyecto-tesis\Proyecto-tesis\Proyecto-tesis\node_modules\express\lib\router\route.js:149:13)
    at Route.dispatch (C:\Users\ANDREE\Documents\drive-download-20240927T200830Z-001\Proyecto-tesis\Proyecto-tesis\Proyecto-tesis\node_modules\express\lib\router\route.js:119:3)
    at Layer.handle [as handle_request] (C:\Users\ANDREE\Documents\drive-download-20240927T200830Z-001\Proyecto-tesis\Proyecto-tesis\Proyecto-tesis\node_modules\express\lib\router\layer.js:95:5)
    at C:\Users\ANDREE\Documents\drive-download-20240927T200830Z-001\Proyecto-tesis\Proyecto-tesis\Proyecto-tesis\node_modules\express\lib\router\index.js:284:15
    at Function.process_params (C:\Users\ANDREE\Documents\drive-download-20240927T200830Z-001\Proyecto-tesis\Proyecto-tesis\Proyecto-tesis\node_modules\express\lib\router\index.js:346:12)
    at next (C:\Users\ANDREE\Documents\drive-download-20240927T200830Z-001\Proyecto-tesis\Proyecto-tesis\Proyecto-tesis\node_modules\express\lib\router\index.js:280:10)
    at Function.handle (C:\Users\ANDREE\Documents\drive-download-20240927T200830Z-001\Proyecto-tesis\Proyecto-tesis\Proyecto-tesis\node_modules\express\lib\router\index.js:175:3)
    at router (C:\Users\ANDREE\Documents\drive-download-20240927T200830Z-001\Proyecto-tesis\Proyecto-tesis\Proyecto-tesis\node_modules\express\lib\router\index.js:47:12)

Node.js v20.17.0
Failed running './src/index.js'

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
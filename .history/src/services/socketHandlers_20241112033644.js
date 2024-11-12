// FILE: src/services/socketHandlers.js
import { Server } from 'socket.io';
import Message from '../models/message.js';

const socketHandlers = (server) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:3000',
        }
    });

io.on('connection', (socket) => {
  console.log('new connection');

  // Escuchar mensajes entrantes
  socket.on('sendMessage', async ({ senderId, receiverId, content, chatId }) => {
    if (!senderId || !receiverId || !content || !chatId) {
      console.error('Missing required fields');
      return;
    }

    const message = new Message({
      senderId,
      receiverId,
      content,
      chatId,
      createdAt: new Date()
    });

    try {
      await message.save();
      io.to(receiverId).emit('receiveMessage', message);
      io.to(senderId).emit('receiveMessage', message); // Emitir también al remitente
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });
});

export default socketHandlers;
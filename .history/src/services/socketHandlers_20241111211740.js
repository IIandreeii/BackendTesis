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
        socket.on('sendMessage', async ({ senderId, receiverId, text }) => {
            if (!senderId || !receiverId || !text) {
                console.error('Missing required fields');
                return;
            }

            const message = new Message({
                senderId,
                receiverId,
                text,
                createdAt: new Date()
            });

            try {
                await message.save();
                io.to(receiverId).emit('receiveMessage', message);
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        // Unirse a una sala específica
        socket.on('joinRoom', (userId) => {
            socket.join(userId);
        });
    });
};

export default socketHandlers;
// FILE: socketHandlers.js
import { Server } from 'socket.io';
import Message from './models/message.js'; // Asegúrate de tener un modelo de mensaje en tu proyecto

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
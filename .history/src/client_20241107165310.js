import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Unirse a una sala
const userId = 'user123';
const organizationId = 'org456';
socket.emit('joinRoom', { userId, organizationId });

// Enviar un mensaje
const message = 'Hola, organización!';
socket.emit('sendMessage', { userId, organizationId, message });

// Recibir un mensaje
socket.on('receiveMessage', ({ userId, organizationId, message }) => {
    console.log(`Mensaje recibido de ${userId} a ${organizationId}: ${message}`);
});

// FILE: src/services/socketHandlers.js
import { Server } from 'socket.io';
import Message from '../models/message.js';

const socketHandlers = (server) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:3000',
        }
    });



export default socketHandlers;
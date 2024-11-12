import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import passport from 'passport';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import major from './routes/index.js';
import auth from './routes/authentication.js';
import mercadopago from './routes/mercadopago.js';
import posts from './routes/posts.js';
import connectDB from './database.js';
import Message from './models/Message.js';

import './lib/auth.js';

dotenv.config();

connectDB();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

app.set('port', process.env.PORT || 3001); // Cambia el puerto aquí

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(cors());

app.use((req, res, next) => {
    app.locals.user = req.user;
    next();
});

// Routes
app.use(major);
app.use(auth);
app.use(mercadopago);
app.use('/posts', posts);

// WebSocket connection
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    // Añadir mensaje de consola cuando el cliente está en línea
    socket.on('online', () => {
        console.log(`Cliente ${socket.id} está en línea`);
    });

    socket.on('joinRoom', ({ userId, organizationId }) => {
        const room = `${userId}-${organizationId}`;
        socket.join(room);
        console.log(`Usuario ${userId} se unió a la sala ${room}`);
    });

    socket.on('sendMessage', async ({ userId, organizationId, message }) => {
        const room = `${userId}-${organizationId}`;
        const newMessage = new Message({
            sender: userId,
            receiver: organizationId,
            content: message,
        });
        await newMessage.save();
        io.to(room).emit('receiveMessage', { userId, organizationId, message });
        console.log(`Mensaje enviado a la sala ${room}: ${message}`);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

server.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});







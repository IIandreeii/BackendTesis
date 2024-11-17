import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import passport from 'passport';
import cors from 'cors';
import { createServer } from 'http';
import major from './routes/index.js';
import auth from './routes/authentication.js';
import mercadopago from './routes/mercadopago.js';
import connectDB from './database.js';
impo
import './lib/auth.js';

import http from 'http';
import socketHandlers from './services/socketHandlers.js';

dotenv.config();

// Conectar a la base de datos
connectDB();

// Configurar el servidor
const app = express();
const server = http.createServer(app);
socketHandlers(server);

// Establecer puerto
app.set('port', process.env.PORT || 3001);

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(cors());

// Servir archivos estáticos (como imágenes) desde la carpeta 'public/imagenes'
app.use(express.static(path.join(__dirname, 'public')));;

// Middleware para pasar el usuario a las rutas
app.use((req, res, next) => {
    app.locals.user = req.user;
    next();
});

// Rutas
app.use(major);
app.use(auth);
app.use(mercadopago);

// Iniciar el servidor
server.listen(app.get('port'), () => {
    console.log(`Server running on port ${app.get('port')}`);
});

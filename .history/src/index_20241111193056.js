// FILE: src/index.js
import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import passport from 'passport';
import cors from 'cors';
import connectDB from './config/db.js';
import socketHandlers from './services/socketHandlers.js';
import major from './routes/major.js';
import auth from './routes/auth.js';
import mercadopago from './routes/mercadopago.js';

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

socketHandlers(server); // Usar el manejador de sockets

app.set('port', process.env.PORT || 3001);

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

server.listen(app.get('port'), () => {
    console.log(`Server running on port ${app.get('port')}`);
});
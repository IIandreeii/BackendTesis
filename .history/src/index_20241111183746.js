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
import './lib/auth.js';


import { Server } from 'socket.io';

import http from 'http'




dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
cons

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





server.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});







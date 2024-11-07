import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan';
import bodyParser from 'body-parser';
import passport from 'passport';


import cors from 'cors';

import major from './routes/index.js'
import auth from './routes/authentication.js'
import mercadopago from './routes/mercadopago.js'
import connectDB from './database.js';

import './lib/auth.js';

dotenv.config();

connectDB();


const app = express()

app.set('port', process.env.PORT)






//middlewares 
app.use(morgan('dev'))
app.use(express.json())
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(cors())


app.use((req, res, next) => {
    app.locals.user = req.user;
    next();
});

//routes

app.use(major);
app.use(auth)
app.use(mercadopago)


app.listen(app.get('port'), () =>{
    console.log('server on port', app.get('port'));
})







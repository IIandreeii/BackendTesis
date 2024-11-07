import passport from 'passport';
import LocalStrategy from 'passport-local';
import User from '../models/user.js';
import Charity from '../models/charity.js'; // Asegúrate de importar el modelo Charity

import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';


passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // Esto permite acceder al objeto req en la callback
}, async (req, email, password, done) => {
    try {
        const { dni, apellido, nombre, descripcion, direccion, telefono, userType } = req.body;
        if (!userType) {
            return done(new Error('El campo userType es requerido.'));
        }

        const existingUser = await User.findOne({ email });

        const existingCharity = await Charity.findOne({ email });

        if (existingUser || existingCharity) {
            return done(null, false, { message: 'Usuario ya existe' });
        }

        let user;

        if (userType === 'charity') {
            user = await Charity.create({
                nombre,
                descripcion,
                email,
                direccion,
                telefono,
                password,
                userType
            });
        } else {
            user = await User.create({
                email,
                password,
                dni,
                apellido,
                nombre,
                userType
            });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));




passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        const charity = await Charity.findOne({ email });

        const account = user || charity;

        if (!account) {
            return done(null, false, { message: 'Usuario no encontrado' });
        }
        // Asegurarse de que el método isValidPassword esté implementado en el modelo User y Charity
        const match = await account.isValidPassword(password);
        if (!match) {
            return done(null, false, { message: 'Contraseña incorrecta' });
        }
        return done(null, account);
    } catch (error) {
        return done(error);
    }
}));


passport.use(new JWTStrategy({
    secretOrKey: 'top_secret', // También corrijo "secretOrkey" a "secretOrKey"
    jwtFromRequest: ExtractJwt.fromUrlQueryParameter('secret_token')
}, async (token, done) => {
    try {
        return done(null, token.user);
    } catch (error) {
        done(error);
    }
}));











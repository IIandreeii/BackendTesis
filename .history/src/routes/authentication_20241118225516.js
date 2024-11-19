import express from 'express'
const router = express.Router();
import User from '../models/user.js'; // Asegúrate de que la ruta sea correcta
import Charity from '../models/charity.js'; // Asegúrate de que la ruta sea correcta
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { URLSearchParams } from 'url';
import axios from 'axios';
import { revokeToken, checkRevokedToken } from '../lib/revokedTokens.js';
import recordAudit from '../lib/recordAudit.js';





router.post('/signup', (req, res, next) => {
    passport.authenticate('local.signup', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(400).json({ message: info.message });
        }
        res.json({
            message: 'Signup successful',
            user: user
        });
    })(req, res, next);
});


router.post('/:id/update', async(req, res, next) => {
    try {
        const updates = req.body;
        console.log(updates);
        const charity = await Charity.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!charity) {
            return res.status(404).send("ONG no encontrada");
        }
        res.status(200).send("Perfil actualizado con exito, " + charity);
        
    } catch (error) {
        return res.status(404).send("ONG no encontrada");
    }
});









// Asegúrate de ajustar la ruta según tu estructura de proyecto

router.get('/profile', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const userId = req.user._id;
        let user = await User.findById(userId);

        if (user) {
            res.json({
                message: 'You made it to the secure route',
                user: {
                    id: user._id,
                    email: user.email,
                    dni: user.dni,
                    apellido: user.apellido,
                    nombre: user.nombre,
                    role: user.role
                },
                token: req.query.secret_token
            });
        } else {
            let charity = await Charity.findById(userId);
            if (charity) {
                res.json({
                    message: 'You made it to the secure route',
                    charity: {
                        id: charity._id,
                        nombre: charity.nombre,
                        descripcion: charity.descripcion,
                        email: charity.email,
                        direccion: charity.direccion,
                        telefono: charity.telefono,
                        userType: charity.userType,
                        accessToken: charity.accessToken
                    },
                    token: req.query.secret_token
                });
            } else {
                res.status(404).json({ message: 'User or Charity not found' });
            }
        }
    } catch (error) {
        next(error);
    }
});


// Ruta para cerrar sesión

// Ruta para cerrar sesión
router.post('/logout', (req, res) => {
    const token = req.query.secret_token;
    if (!token) {
        return res.status(400).json({ message: 'Token no proporcionado' });
    }
    try {
        revokeToken(token);
        res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (err) {
        res.status(500).json({ message: `Error al cerrar sesión: ${err.message}` });
    }
});



//apartado de mercado pago


export default router;
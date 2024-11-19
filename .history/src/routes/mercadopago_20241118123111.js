import express from 'express';
import axios from 'axios';
import Charity from '../models/charity.js'; 
import mongoose from 'mongoose';
import Donation from '../models/donation.js';
import { generateReport } from '../services/reportesdonaciones.js';

const router = express.Router();

// Ruta para autenticar a la organización benéfica
router.get('/mercadopago/auth/:id', (req, res) => {
    const { id } = req.params;
    const client_id = '1901957005842671';
    const redirect_uri = 'https://helped-suitable-elk.ngrok-free.app/mercadopago/callback';

    const authorizationUrl = `https://auth.mercadopago.com.pe/authorization?client_id=${client_id}&response_type=code&platform_id=mp&redirect_uri=${redirect_uri}&state=${id}`;
    res.redirect(authorizationUrl);
});

// Nueva ruta para manejar la redirección inicial desde Mercado Pago
router.get('/mercadopago/callback', (req, res) => {
    const { code, state } = req.query;
    const id = state;

    res.redirect(`/mercadopago/callback/${id}?code=${code}`);
});

// Callback para recibir el código de autorización
router.get('/mercadopago/callback/:id', async (req, res) => {
    const { id } = req.params;
    const authorizationCode = req.query.code;

    if (!authorizationCode) {
        return res.status(400).json({ message: 'Código de autorización no proporcionado' });
    }

    try {
        const client_id = '1901957005842671';
        const client_secret = 'wrdU655Oeu2RKIEb2Ph92CAjVT8hZ4ti';
        const redirect_uri = 'https://helped-suitable-elk.ngrok-free.app/mercadopago/callback';

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', client_id);
        params.append('client_secret', client_secret);
        params.append('code', authorizationCode);
        params.append('redirect_uri', redirect_uri);

        const response = await axios.post('https://api.mercadopago.com/oauth/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token, refresh_token, expires_in } = response.data;
        const expirationTime = Math.floor(Date.now() / 1000) + expires_in;

        const charity = await Charity.findById(id);
        if (charity) {
            charity.accessToken = access_token;
            charity.refreshToken = refresh_token;
            charity.expirationTime = expirationTime;
            await charity.save();
            return res.json({ 
                message: 'Autorización completada exitosamente',
            });
        } else {
            return res.status(404).json({ message: 'Organización benéfica no encontrada' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al obtener el token: ${error.response ? error.response.data : error.message}` });
    }
});

router.get('/charities', async (req, res) => {
    try {
        const charities = await Charity.find();
        res.json(charities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las organizaciones benéficas' });
    }
});

router.post('/mercadopago/donate/:id', async (req, res) => {
    const { id } = req.params;
    const { amount, donorName } = req.body;

    console.log('amount', amount);

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'ID de organización benéfica no válido' });
    }

    try {
        const charity = await Charity.findById(id);
        if (!charity) {
            return res.status(404).json({ message: 'Organización benéfica no encontrada' });
        }

        const preferenceData = {
            items: [
                {
                    title: `Donación para ${charity.nombre}`,
                    quantity: 1,
                    unit_price: parseFloat(amount),
                    currency_id: 'PEN',
                },
            ],
            payer: {
                name: donorName,
            },
            back_urls: {
                success: 'https://helped-suitable-elk.ngrok-free.app/mercadopago/success',
                failure: 'https://helped-suitable-elk.ngrok-free.app/mercadopago/error',
            },
            auto_return: 'approved',
            external_reference: id,
        };

        const response = await axios.post('https://api.mercadopago.com/checkout/preferences', preferenceData, {
            headers: {
                'Authorization': `Bearer ${charity.accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        return res.json({
            message: 'Preferencia de pago creada',
            init_point: response.data.init_point,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al crear la preferencia: ${error.message}` });
    }
});

router.get('/mercadopago/success', async (req, res) => {
    const paymentId = req.query.payment_id;

    try {
        const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer APP_USR-1901957005842671-111119-86e781d67eaa4603a58a5fffee6a37dc-2090145757`,
            },
        });

        const paymentDetails = response.data;
        const payer = paymentDetails.payer || {};
        const card = paymentDetails.card || {};

        const payerName = `${payer.first_name || ''} ${payer.last_name || ''}`.trim();
        const payerEmail = payer.email || 'No disponible';
        const cardLastFourDigits = card.last_four_digits || 'No disponible';
        const paymentAmount = paymentDetails.transaction_amount;
        const paymentStatus = paymentDetails.status;
        const paymentMethod = paymentDetails.payment_method_id;
        const charityId = paymentDetails.external_reference;

        if (!charityId || charityId === 'null') {
            throw new Error('El ID de la organización benéfica no está disponible en external_reference.');
        }

        const charityObjectId = new mongoose.Types.ObjectId(charityId);

        const donation = new Donation({
            charityId: charityObjectId,
            donorName: payerName || 'Nombre no disponible',
            donorEmail: payerEmail,
            amount: paymentAmount,
            paymentId,
            paymentStatus,
            paymentMethod,
            cardLastFourDigits,
            currency: paymentDetails.currency_id || 'No disponible',
        });

        await donation.save();

        res.redirect('http://localhost:3000/gracias');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al obtener los detalles del pago o guardar la donación: ${error.message}` });
    }
});

router.get('/mercadopago/donations/:charityId', async (req, res) => {
    const { charityId } = req.params;
    if (!mongoose.isValidObjectId(charityId)) {
        return res.status(400).json({ message: 'ID de organización benéfica no válido' });
    }
    try {
        const donations = await Donation.find({ charityId: charityId });
        if (!donations.length) {
            return res.status(404).json({ message: 'No se encontraron donaciones para esta organización benéfica' });
        }
        res.json(donations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al obtener las donaciones: ${error.message}` });
    }
});



router.get('/mercadopago/error', (req, res) => {
    const paymentId = req.query.payment_id;
    const status = req.query.status;
    const merchantOrderId = req.query.merchant_order_id;

    res.json({
        message: 'error en el pago',
    });
});



router.get('/mercadopago/report/weekly/:charityId', async (req, res) => {
    await generateReport(req, res, 'weekly');
});

router.get('/mercadopago/report/monthly/:charityId', async (req, res) => {
    await generateReport(req, res, 'monthly');
});

router.get('/mercadopago/report/annual/:charityId', async (req, res) => {
    await generateReport(req, res, 'annual');
});















export default router;





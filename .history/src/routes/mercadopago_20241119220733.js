import express from 'express';
import axios from 'axios';
import Charity from '../models/charity.js'; 
import mongoose from 'mongoose';
import Donation from '../models/donation.js';
import { generateReport } from '../services/reportesdonaciones.js';
import donationproducts from '../models/donationproducts.js';
import { generateExcelReport } from '../services/reportescomida.js';
import recordAudit from '../lib/recordAudit.js';
import Audit from '../models/auditorias.js';
import User from '../models/user.js';

const router = express.Router();

// Ruta para autenticar a la organización benéfica
const crypto = require('crypto');

// Función para generar un code_verifier y su correspondiente code_challenge
function generateCodeVerifierAndChallenge() {
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return { codeVerifier, codeChallenge };
}

router.get('/mercadopago/auth/:id', (req, res) => {
    const { id } = req.params;
    const client_id = '1901957005842671';
    const redirect_uri = 'https://helped-suitable-elk.ngrok-free.app/mercadopago/callback';

    const { codeVerifier, codeChallenge } = generateCodeVerifierAndChallenge();
    req.session.codeVerifier = codeVerifier; // Almacena el code_verifier en la sesión

    const authorizationUrl = `https://auth.mercadopago.com.pe/authorization?client_id=${client_id}&response_type=code&platform_id=mp&redirect_uri=${redirect_uri}&state=${id}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    res.redirect(authorizationUrl);
});

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
        const codeVerifier = req.session.codeVerifier; // Recupera el code_verifier de la sesión

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id,
            client_secret,
            code: authorizationCode,
            redirect_uri,
            code_verifier: codeVerifier, // Incluye el code_verifier en la solicitud
        });

        console.log("Params:", params.toString());

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
        console.error("Error Data:", error.response ? error.response.data : error.message);
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


router.post('/mercadopago/donations/in-kind', async (req, res) => {
    const { charityId, donorName, itemType, quantity, unit, valuePerUnit, userId } = req.body;

    if (!mongoose.isValidObjectId(charityId)) {
        return res.status(400).json({ message: 'ID de organización benéfica no válido' });
    }

    if (!donorName || !itemType || !quantity || !unit || !valuePerUnit) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Validar la unidad
    const validUnits = ['kg', 'unidad'];
    if (!validUnits.includes(unit)) {
        return res.status(400).json({ message: `Unidad no válida. Debe ser una de las siguientes: ${validUnits.join(', ')}` });
    }

    try {
        const donationProduct = new donationproducts({
            charityId,
            donorName,
            itemType,
            quantity,
            unit,
            valuePerUnit
        });

        await donationProduct.save();
        await recordAudit('create', charityId, donationProduct._id, userId, { donationData: req.body });
        res.status(201).json({ message: 'Donación en especie registrada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al registrar la donación: ${error.message}` });
    }
});

// Obtener reporte de donaciones en especie
router.get('/mercadopago/report/in-kind/:charityId', async (req, res) => {
    const { charityId } = req.params;
    const userId = req.user ? req.user._id : null; // Asume que el ID del usuario está disponible en req.user

    if (!mongoose.isValidObjectId(charityId)) {
        return res.status(400).json({ message: 'ID de organización benéfica no válido' });
    }

    try {
        const donationsInKind = await donationproducts.find({ charityId: charityId });

        if (!donationsInKind.length) {
            return res.status(404).json({ message: 'No se encontraron donaciones en especie para esta organización benéfica' });
        }

        const totalValue = donationsInKind.reduce((acc, donation) => {
            return acc + (donation.quantity * donation.valuePerUnit);
        }, 0);

        const report = donationsInKind.map(donation => ({
            donationId: donation._id,
            donorName: donation.donorName,
            itemType: donation.itemType,
            quantity: donation.quantity,
            unit: donation.unit,
            valuePerUnit: donation.valuePerUnit,
            totalValue: donation.quantity * donation.valuePerUnit,
            createdAt: donation.createdAt
        }));

        // Incluir los IDs de las donaciones en los detalles de la auditoría
        const donationIds = donationsInKind.map(donation => donation._id);

        await recordAudit('report', charityId, null, userId, { reportType: 'in-kind', donationIds });
        res.json({ totalValue, report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al generar el reporte: ${error.message}` });
    }
});
// Editar una donación existente
router.put('/mercadopago/report/in-kind/:donationId', async (req, res) => {
    const { donationId } = req.params;
    const { userId, ...updateData } = req.body;

    if (!mongoose.isValidObjectId(donationId)) {
        return res.status(400).json({ message: 'ID de donación no válido' });
    }

    try {
        const donation = await donationproducts.findById(donationId);
        if (!donation) {
            return res.status(404).json({ message: 'Donación no encontrada' });
        }

        const before = donation.toObject();
        Object.assign(donation, updateData);
        await donation.save();

        await recordAudit('edit', donation.charityId, donationId, userId, { before, after: donation.toObject() });
        res.status(200).json({ message: 'Donación editada correctamente', donation });
    } catch (error) {
        res.status(500).json({ message: `Error al editar la donación: ${error.message}` });
    }
});

// Eliminar una donación existente
router.delete('/mercadopago/report/in-kind/:donationId', async (req, res) => {
    const { donationId } = req.params;
    const { userId, reason } = req.body;

    if (!mongoose.isValidObjectId(donationId)) {
        return res.status(400).json({ message: 'ID de donación no válido' });
    }

    try {
        const donation = await donationproducts.findById(donationId);
        if (!donation) {
            return res.status(404).json({ message: 'Donación no encontrada' });
        }

        const before = donation.toObject();
        await donationproducts.deleteOne({ _id: donationId });

        await recordAudit('delete', donation.charityId, donationId, userId, { before, reason });
        res.status(200).json({ message: 'Donación eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al eliminar la donación: ${error.message}` });
    }
});

// Generar reporte semanal en Excel
router.get('/mercadopago/report/in-kind/excel/weekly/:charityId', async (req, res) => {
    const { charityId } = req.params;
    const userId = req.user ? req.user._id : null; // Asume que el ID del usuario está disponible en req.user

    if (!mongoose.isValidObjectId(charityId)) {
        return res.status(400).json({ message: 'ID de organización benéfica no válido' });
    }

    await recordAudit('report', charityId, null, userId, { period: 'weekly' });
    await generateExcelReport(charityId, 'weekly', res);
});

// Generar reporte mensual en Excel
router.get('/mercadopago/report/in-kind/excel/monthly/:charityId', async (req, res) => {
    const { charityId } = req.params;
    const userId = req.user ? req.user._id : null; // Asume que el ID del usuario está disponible en req.user

    if (!mongoose.isValidObjectId(charityId)) {
        return res.status(400).json({ message: 'ID de organización benéfica no válido' });
    }

    await recordAudit('report', charityId, null, userId, { period: 'monthly' });
    await generateExcelReport(charityId, 'monthly', res);
});

// Generar reporte anual en Excel
router.get('/mercadopago/report/in-kind/excel/annual/:charityId', async (req, res) => {
    const { charityId } = req.params;
    const userId = req.user ? req.user._id : null; // Asume que el ID del usuario está disponible en req.user

    if (!mongoose.isValidObjectId(charityId)) {
        return res.status(400).json({ message: 'ID de organización benéfica no válido' });
    }

    await recordAudit('report', charityId, null, userId, { period: 'annual' });
    await generateExcelReport(charityId, 'annual', res);
});


router.get('/audits/:charityId', async (req, res) => {
    const { charityId } = req.params;
    if (!mongoose.isValidObjectId(charityId)) {
        return res.status(400).json({ message: 'ID de organización benéfica no válido' });
    }

    try {
        const audits = await Audit.find({ charityId }).sort({ timestamp: -1 });

        // Obtener los nombres de los usuarios y organizaciones que realizaron las acciones
        const userIds = audits.map(audit => audit.userId).filter(userId => userId);
        const charityIds = audits.map(audit => audit.charityId).filter(charityId => charityId);

        const users = await User.find({ _id: { $in: userIds } }).select('nombre');
        const charities = await Charity.find({ _id: { $in: charityIds } }).select('nombre');

        const userMap = users.reduce((acc, user) => {
            acc[user._id] = user.name;
            return acc;
        }, {});

        const charityMap = charities.reduce((acc, charity) => {
            acc[charity._id] = charity.nombre;
            return acc;
        }, {});

        // Agregar el nombre del usuario o de la organización a cada registro de auditoría
        const auditsWithNames = audits.map(audit => {
            const userName = userMap[audit.userId] || charityMap[audit.charityId] || 'Desconocido';
            return {
                ...audit.toObject(),
                userName
            };
        });

        res.status(200).json(auditsWithNames);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error al obtener las auditorías: ${error.message}` });
    }
});




export default router;





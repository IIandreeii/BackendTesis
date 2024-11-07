import axios from 'axios';

const createPaymentPreference = async (preferenceData, accessToken) => {
    try {
        const response = await axios.post('https://api.mercadopago.com/checkout/preferences', preferenceData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(`Error al crear la preferencia de pago: ${error.message}`);
    }
};

const getPaymentDetails = async (paymentId, accessToken) => {
    try {
        const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(`Error al obtener los detalles del pago: ${error.message}`);
    }
};

export { createPaymentPreference, getPaymentDetails };

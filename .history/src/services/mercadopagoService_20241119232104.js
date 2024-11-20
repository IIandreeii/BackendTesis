import axios from 'axios';

export const mercadoPagoService = {
    createPreference: async (accessToken, preferenceData) => {
        const response = await axios.post('https://api.mercadopago.com/checkout/preferences', preferenceData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    },

    getPaymentDetails: async (paymentId, accessToken) => {
        const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        return response.data;
    }
};

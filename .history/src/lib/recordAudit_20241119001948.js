import Audit from '../models/auditorias.js';

const recordAudit = async (action, charityId, donationId, userId, details) => {
    const audit = new Audit({
        action,
        charityId,
        donationId,
        userId,
        details: details || {} // Asegúrate de que details siempre sea un objeto
    });
    await audit.save();
};

export default recordAudit;
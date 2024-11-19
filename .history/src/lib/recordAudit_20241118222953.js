import Audit from '../models/audit.js';

const recordAudit = async (action, charityId, userId, details) => {
    const audit = new Audit({
        action,
        charityId,
        userId,
        details
    });
    await audit.save();
};

export default recordAudit;
import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
    action: { type: String, required: true }, // 'create', 'edit', 'delete', 'login', 'report'
    charityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', required: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    timestamp: { type: Date, default: Date.now },
    details: { type: Object, required: true }
});

const Audit = mongoose.model('Audit', auditSchema);

export default Audit;
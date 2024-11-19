import mongoose from 'mongoose';

const donationInKindSchema = new mongoose.Schema({
    charityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', required: true },
    donorName: { type: String, required: true },
    itemType: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    valuePerUnit: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const DonationInKind = mongoose.model('DonationInKind', donationInKindSchema);

export default DonationInKind;
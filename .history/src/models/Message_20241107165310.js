import mongoose from 'mongoose';

const { Schema } = mongoose;

const MessageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, {
    timestamps: true
});

export default mongoose.model('Message', MessageSchema);

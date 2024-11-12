import mongoose from 'mongoose';

const { Schema } = mongoose;

const PostSchema = new Schema({
    content: { type: String, required: true },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    timestamp: { type: Date, default: Date.now },
}, {
    timestamps: true
});

export default mongoose.model('Post', PostSchema);

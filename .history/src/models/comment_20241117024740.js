// FILE: src/models/comment.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const commentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    charity: {
        type: Schema.Types.ObjectId,
        ref: 'Charity',
        required: false
    },
    publication: {
        type: Schema.Types.ObjectId,
        ref: 'Publication',
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
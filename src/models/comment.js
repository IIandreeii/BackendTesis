// FILE: src/models/comment.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const commentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: function() { return !this.charity; } // Obligatorio si no hay charity
    },
    charity: {
        type: Schema.Types.ObjectId,
        ref: 'Charity',
        required: function() { return !this.user; } // Obligatorio si no hay user
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
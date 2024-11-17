// FILE: src/models/publication.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const publicationSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    charity: {
        type: Schema.Types.ObjectId,
        ref: 'Charity',
        required: true
    },
    likes: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        charity: {
            type: Schema.Types.ObjectId,
            ref: 'Charity',
            required: false
        }
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }]
}, {
    timestamps: true
});

const Publication = mongoose.model('Publication', publicationSchema);

export default Publication;
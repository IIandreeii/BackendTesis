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
    imageUrl: {
        type: String,
        required: false
    },
    location: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    charity: {
        type: Schema.Types.ObjectId,
        ref: 'Charity',
        required: true
    },
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Publication = mongoose.model('Publication', publicationSchema);

export default Publication;
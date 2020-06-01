const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageModel = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        lowercase: true,
        required: true
    },
    date: {
        type: Date,
        default: new Date()
    },
    content: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Message', MessageModel);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PublicInstanceModel = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    password: {
        type: String
    },
    date: {
        type: Date,
        default: new Date()
    },
    messages: [{
        type: Schema.Types.ObjectId,
        ref: 'Message'
    }],
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('PublicInstance', PublicInstanceModel);
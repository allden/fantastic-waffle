const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserModel = new Schema({
    username: {
        type: String,
        lowercase: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    about: {
        type: String
    },
    age: {
        type: Number
    },
    location: {
        type: String
    },
    gender: {
        type: String
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    createdRooms: {
        type: Schema.Types.ObjectId,
        ref: 'PublicInstanceModel'
    },
    friendsList: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
});

module.exports = mongoose.model('User', UserModel);
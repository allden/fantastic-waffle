const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrivateInstanceModel = new Schema({
    users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    date: {
        type: Date,
        default: new Date()
    },
    messages: [{
        type: Schema.Types.ObjectId,
        ref: 'Message'
    }],
    unread: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('PrivateInstance', PrivateInstanceModel);
   /*  sending to individual socketid (private message)
    io.to(socketId).emit('hey', 'I just met you');
    goal: figure out how to send the socket id to the initiator

    initiator sends a message (emit private message event)
    check if conversation exists between these users
    if it exists, create a message and append it to the existing instance
    if not, create the instance and append the message to the new instance
    once this is done, the server responds with an event which will hold the room information and messages */
    
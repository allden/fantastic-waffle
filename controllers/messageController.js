const Message = require('../models/MessageModel');

module.exports.createMessage = (msgObj, roomId, cb) => {
    const {msg, id} = msgObj;

    return new Message({
        content: msg,
        sender: id
    })
    .save()
    .then(message => {
        return Message.findById({_id: message._id})
        .populate('sender')
        .then(async populated => {
            // the cb refers to the appendMessage function for both the private and public instance controllers
            let msg = await cb(populated, roomId);
            return msg;
        })
        .catch(err => errHandling(err));
    })
    .catch(err => errHandling(err));
};

function errHandling(err) {
    return console.error(err);
};
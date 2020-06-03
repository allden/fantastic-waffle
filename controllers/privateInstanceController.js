const PrivateInstance = require('../models/PrivateInstanceModel');
const User = require('../models/UserModel');
const messageController = require('./messageController');

module.exports.createPrivateInstance = (info) => {
    return User.findOne({username: info.to})
    .then(user => {
        // info.from is already an ID, info.to needed to be converted
        const sender = info.from;
        const recipient = user._id;

        if(!user) {
            return {
                error: 'Something went wrong!'
            };
        };

        // if the sender and recipient match the array exactly, including the length
        // doing this allows the user to chat with themselves as well
        return PrivateInstance.findOne({$or: [
            {users: {$eq: [sender, recipient]}},
            {users: {$eq: [recipient, sender]}}
        ]})
        .then(room => {
            // sender is added here because this is what will be assigned to the message as "sender" once it is created
            const msgObj = {
                msg: info.message,
                id: sender
            };

            // if it already exists append message to old room
            if(room) {
                // update the room so that the recipient gets the notification
                return PrivateInstance.findByIdAndUpdate({_id: room._id}, {$push: {unread: recipient}})
                .then(async() => {
                    return await messageController.createMessage(msgObj, room._id, appendMessage);
                })
                .catch(err => errHandling(err));
            };

            // if it doesn't create a new room and append the message to that one
            return new PrivateInstance({
                users: [recipient, sender],
                // whenever a new instance is created, append the recipient to the unread array so they get a notification
                unread: [recipient, sender]
            })
            .save()
            .then(async newRoom => {
                return await messageController.createMessage(msgObj, newRoom._id, appendMessage);
            })
            .catch(err => errHandling(err));
        })
        .catch(err => errHandling(err));
    })
    .catch(err => errHandling(err));
};

function appendMessage(msg, roomId) {
    return PrivateInstance.findByIdAndUpdate({_id: roomId}, {$push: {messages: msg._id}})
    .then(() => {
        // msg.toObject() is necessary because using the spread operator returns a document, rather than an object
        const data = {
            msg: {...msg.toObject()},
            room: roomId
        };
        return data;
    })
    .catch(err => errHandling(err));
};

module.exports.getPrivateMessageHistory = (msgInfo) => {
    const sender = msgInfo.from;
    return User.findOne({username: msgInfo.to})
    .then(user => {
        const recipient = user._id;

        // get the instance that matches the conversation between the currently logged in user and the selected one
        return PrivateInstance.findOne({$or: [
            {users: {$eq: [sender, recipient]}},
            {users: {$eq: [recipient, sender]}}
        ]})
        .populate({
            path: 'messages',
            populate: {
                path: 'sender'
            }
        })
        .then(found => {
            // if a conversation between the two users is found, append the messages, otherwise just return
            if(found) {
                // also make sure to pull the sender of the request from the unread array, as they've clearly seen the conversation
                return PrivateInstance.findByIdAndUpdate({_id: found._id}, {$pull: {unread: sender}})
                .then(() => {
                    return found.messages;
                })
                .catch(err => errHandling(err));
            };
            
            return
        })
        .catch(err => errHandling(err));
    })
    .catch(err => errHandling(err));
};

module.exports.getAllUnreadConversations = (loggedInUser) => {
    return User.findOne({username: loggedInUser})
    .then(user => {
        return PrivateInstance.find({users: user._id, unread: user._id})
        .populate('users')
        .then(unread => {
            unreadUsers = [];
            /* for every unread conversation, get the user that is NOT the currently logged in user and put their name in an array
            afterwards return that array, this is needed in order to populate the active conversations upon user login and also
            to inform the user when they've received a new message */
            unread.forEach(conversation => {
                const unreadUser = conversation.users.filter(item => {
                    if(item) return item.username !== loggedInUser
                });

                if(unreadUser.length > 0) {
                    unreadUsers.push(unreadUser[0].username);
                };
            });

            return unreadUsers;
        })
        .catch(err => errHandling(err));
    })
    .catch(err => errHandling(err));
};

function errHandling(err) {
    console.error(err);
};
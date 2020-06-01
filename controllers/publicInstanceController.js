const PublicInstance = require('../models/PublicInstanceModel');

module.exports.getAllPublicRooms = (req, res) => {
    PublicInstance.find({})
    .then(rooms => {
        return res.render('roomList', {rooms});
    })
    .catch(err => errHandling(err));
};

module.exports.getSpecificRoom = (req, res) => {
    const {title} = req.params;

    PublicInstance.findOne({title})
    .then(found => {
        if(found) return res.render('chat');
        else nonExistentHandler(req, res);
    })
    .catch(err => errHandling(err));
};

module.exports.getPublicRoomForm = (req, res) => {
    res.render('createRoom');
};

// return the promise so i can await and THEN send the message
module.exports.appendMessage = (msg, id) => {
    // this is the callback for the createMessage function in messageController
    return PublicInstance.findByIdAndUpdate({_id: id}, {$push: {messages: msg._id}})
    .then(() => {
        return msg
    })
    .catch(err => errHandling(err));
};

module.exports.getRoomId = (title) => {
    return PublicInstance.findOne({title})
    .then(room => {
        return room._id
    })
    .catch(err => errHandling(err));
};

module.exports.returnMessages = (room) => {
    return PublicInstance.findOne({title: room})
    .populate({
        path: 'messages',
        populate: {
            path: 'sender'
        }
    })
    .then(room => {
        return room.messages
    })
    .catch(err => errHandling(err));
};

module.exports.createPublicRoom = (req, res) => {
    const {title, password, description} = req.body;
    const titleValidation = /^[A-Z0-9a-z]+$/;
    let errors = [];
    
    if(!title) {
        errors.push('Title cannot be blank.');
    };
    
    if(title.length <= 3) {
        errors.push('Title must be longer than 3 characters.');
    };

    if(titleValidation.test(title) === false) {
        errors.push('Title must only contain alphanumeric symbols. No spaces.');
    };
    
    PublicInstance.findOne({title})
    .then(found => {
        if(found) errors.push('Room already exists!');
        
        if(errors.length > 0) {
            req.flash('messages', errors);
            // this is to reload the variable in ejs
            res.locals.messages = req.flash('messages');
            return res.render('createRoom');
        } else {
            new PublicInstance({
                title,
                description,
                password,
                creator: req.user._id
            })
            .save()
            .then(room => {
                console.log('Room created successfully', room);
                req.flash('messages', 'Success!');
                res.locals.messages = req.flash('messages');
                return res.render('createRoom');
            })
            .catch(err => errHandling(err));
        };
    })
    .catch(err => errHandling(err));
};

function errHandling(err) {
    return console.error(err);
};

function nonExistentHandler(req, res) {
    return res.send('not found!');
};
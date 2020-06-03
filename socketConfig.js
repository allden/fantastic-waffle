const publInstController = require('./controllers/publicInstanceController');
const msgController = require('./controllers/messageController');
const privInstController = require('./controllers/privateInstanceController');
const userController = require('./controllers/userController');

module.exports = (io) => {
    let users = [];
    io.on('connection', socket => {
        socket.on('disconnect', () => {
            console.log('disconnected');
            let filtered = users.filter(user => user.socket !== socket.id);
            users = [...filtered];
        });
        
        let room = '';
        // what happens on join event, the socket is joined to the room
        socket.on('join', async roomTitle => {
            // todo maybe send a message to the users stating that someone has joined
            // todo send an array with all messages for that specific room
            room = roomTitle;
            socket.join(room);

            let roomMessages = await publInstController.returnMessages(room)
            .then(msgList => {
                socket.emit('history', msgList);
            })
            .catch(err => errHandling(err));
        });

        // only emit to that specific room because the event occurred inside of it
        socket.on('message', async msgObj => {
            // create an instance of the message schema
            // i want to update the specific room schema with the message and afterwards emit the message back to the room
            let roomId = await publInstController.getRoomId(room)
            .then(async id => {
                let response = await msgController.createMessage(msgObj, id, publInstController.appendMessage)
                .then(msg => {
                    io.to(room).emit('message', msg);
                })
                .catch(err => errHandling(err));
            })
            .catch(err => errHandling(err));
        });

        // meet people handlers
        socket.on('connectMeetPeople', async userInfo => {
            users.push(userInfo);

            // this needs to be here so that we can get the username easily
            const unreadMessages = await privInstController.getAllUnreadConversations(userInfo.username).then(unreads => {
                socket.emit('activeConversations', unreads);
            });
        });

        // private message handler
        socket.on('privateMessage', async messageInfo => {
            const recipient = users.filter(user => user.username === messageInfo.to)[0];
            const recipientSocket = recipient ? recipient.socket : '';

            // the data also contains the room because i need it in order to make a room
            const data = await privInstController.createPrivateInstance(messageInfo).then(async data => {
                const room = data.room;
                const msg = data.msg;
                
                socket.join(room);
                if(recipientSocket) {
                    io.sockets.connected[recipientSocket].join(room);

                    // return all active conversations when a private message is sent to the logged in user
                    const unreadMessages = await privInstController.getAllUnreadConversations(recipient.username);
                    // whenever a private message is sent, we want to emit the user's current active conversations and also the message itself
                    io.to(recipientSocket).emit('activeConversations', unreadMessages);
                };

                io.to(room).emit('privateMessage', msg);
            });
            // check if room that contains both ids exists
            // if room does not exist, create a room
            // append the message to the newly created room
            // return the room id
            // if recipient is online and not in the room, join socket to room id
            // emit the message to everyone in the room
        });

        socket.on('privateMessageHistory', async messageInfo => {
            const messages = await privInstController.getPrivateMessageHistory(messageInfo).then(msgArr => {
                socket.emit('privateMessageHistory', msgArr);
            });
        });

        socket.on('requestFriends', async user => {
            const friendsList = await userController.getFriendsListAsync(user);
            socket.emit('requestFriends', friendsList);
        });

        socket.on('requestPeopleList', async () => {
            const peopleList = await userController.getUsersAsync();
            socket.emit('requestPeopleList', peopleList);
        });
    });
};

function errHandling(err) {
    console.error(err);
};
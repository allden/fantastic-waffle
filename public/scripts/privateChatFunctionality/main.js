// message window
const messages = document.getElementById('messages');
// list of currently active conversations
const activeConversations = document.getElementById('active-conversations');
// list of people container
const peopleList = document.getElementById('people-list');
// friends btn
const friendsBtn = document.getElementById('friends-btn');
// meet people btn
const meetPeopleBtn = document.getElementById('meet-btn');
// audio element
const audio = document.querySelector('audio');
// this is to determine if the user is on the friends tab or the meet people tab, it will change to 'friends' or 'people' respectively
let currentlyViewing = '';

const socket = io();

socket.on('connect', () => {
    // what i will be pushing to the server in the users object
    const userInfo = {
        username: currentUserName,
        socket: socket.io.engine.id
    };
    // this emits the event with the user info in order for me to keep track of which user has which socket
    socket.emit('connectToChat', userInfo);
});
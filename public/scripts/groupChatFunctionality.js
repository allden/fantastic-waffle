// socket
            
const socket = io();
            
let path = window.location.pathname;
let roomId = path.split('/')[2];

const msgForm = document.getElementById('message-form');
const msgInput = document.getElementById('message-input');
const messages = document.getElementById('messages');

// socket operations    
// join the user to the specific room
socket.emit('join', roomId);

socket.on('connect', () => {
    // what i will be pushing to the server in the users object
    const userInfo = {
        username: currentUserName,
        socket: socket.io.engine.id
    };
    // this emits the event with the user info in order for me to keep track of which user has which socket
    socket.emit('connectToChat', userInfo);
});

// this is sent as a response to the user joining
socket.on('history', msgList => {
    populateHistory(msgList);
});

socket.on('message', msg => {
    sendMessage(msg);
});

msgForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if(msgInput.value !== '') {
        console.log('clicked');
        let msgObj = {
            id: currentUserId,
            msg: msgInput.value
        };
        socket.emit('message', msgObj);
    };
});

// append the message

function sendMessage(msg) {
    if(msg.error) {
        messages.innerHTML=errHandling(msg.error);
        return
    };
    msgInput.value = '';
    messages.innerHTML+=msgElement(msg);
};

function populateHistory(msgList) {
    messages.innerHTML='';
    msgList.forEach(msg => {
        messages.innerHTML+=msgElement(msg);
    });
};

function msgElement(msgObj) {
    console.log(msgObj);
    return `
        <div>
            <p>${!msgObj.sender ? 'deleted' : msgObj.sender.username}</p>
            <p>${new Date(msgObj.date).toLocaleString()}</p>
            <p>${msgObj.content}</p>
        </div>
    `;
};

function errHandling(err) {
    return `
            <p>${err}</p>
            <p>Please refresh the page.</p>
        `;
};
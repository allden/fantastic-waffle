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

// get friendsList based on username whenever you click on the "friends-btn" button
friendsBtn.addEventListener('click', () => requestFriendsList(currentUserName));
meetPeopleBtn.addEventListener('click', requestPeopleList);

const socket = io();

socket.on('connect', () => {
    // what i will be pushing to my server in my users object
    const userInfo = {
        username: currentUserName,
        socket: socket.io.engine.id
    };
    // this emits the event with the user info in order for me to keep track of which user has which socket
    socket.emit('connectMeetPeople', userInfo);
});

socket.on('activeConversations', unreads => {
    const currentChat = document.getElementById('current');
    // whenever the user connectMeetPeople event is emitted, it returns the activeConversations event with the unread messages
    populateActiveConversations(unreads);
    unreads.forEach(unreadUser => {
        let activeElement = checkIfActiveConversationBlockExists(unreadUser);
        // if there is an existing activeElement
        // AND there is either no currentChat OR there is a currentChat, BUT the textContent is NOT equal to the currently iterated value
        console.log(activeElement && (!currentChat || (currentChat && currentChat.textContent !== unreadUser)));
        if(activeElement && (!currentChat || (currentChat && currentChat.textContent !== unreadUser))) {
            console.log('ran');
            // compare the active-conversation divs on the screen with the unreadUser we get from our backend and apply the "new" class accordingly.
            activeElement.setAttribute('class','new active-conversation')
        };
    });
});

socket.on('privateMessage', msg => {
    const currentChat = document.getElementById('current');
    const sender = msg.sender.username;
    // if the message is from the currently selected user (#current div) or the user that sent it, then we want to display
    // the message.
    if(currentChat && sender === currentChat.textContent || sender === currentUserName) {
        appendMessage(msg);
        scrollToBottom(messages);
    };

    /* 
    we want the current user to know that they received a message even if they are offline 
    this can be accomplished by adding a read array on every privateInstance with the recipient 

    the moment the user enters the page or a private message is sent to them, 
    we want to provide them with all privateInstances that are associated with them and have their id pulled from the array
    those active conversations will be represented by divs
    */
});

// whenever a user clicks on a conversation, they will get a list of all messages with that specific user
socket.on('privateMessageHistory', msgArr => {
    // prevents the messages from rendering twice on two user clicks or more
    messages.textContent='';

    // if there's messages, append them to the div with the id of messages
    if(msgArr) {
        msgArr.forEach(msg => {
            appendMessage(msg);
        });
    };
    scrollToBottom(messages);
});

socket.on('requestFriends', friends => {
    peopleList.innerHTML='';
    // for every person in the friends array, we create a card for them and then append it to our people list container
    friends.forEach(friend => {
        const card = generatePersonCard(friend);
        peopleList.appendChild(card);
    });
});

socket.on('requestPeopleList', people => {
    peopleList.innerHTML='';
    people.forEach(person => {
        const card = generatePersonCard(person);
        peopleList.appendChild(card);
    });
});

function generatePersonCard(person) {
    // what will appear for each user
    const container = document.createElement('div');
    container.setAttribute('class', 'person');
    const about = createElementAndText('p', person.about || 'Unset');
    const unorderedList = document.createElement('ul');
    const listItems = [
        createElementAndText('li', person.username),
        createElementAndText('li', person.age || 'Unset'),
        createElementAndText('li', person.gender || 'Unset'),
        createElementAndText('li', person.location || 'Unset')
    ];

    // append multiple children at once
    const docFrag = createDocumentFragment(listItems);

    // append to ul
    unorderedList.appendChild(docFrag);
    // append to our container
    container.appendChild(unorderedList);
    container.appendChild(about);

    container.addEventListener('click', personEvent);

    return container
};

// utility class to create elements with text inside
function createElementAndText(type, text) {
    const element = document.createElement(type);
    const textNode = document.createTextNode(text);
    element.appendChild(textNode);
    return element;
};

// create documentFragment utility function
function createDocumentFragment(elemList) {
    const docFrag = document.createDocumentFragment();
    
    // iterate over all and add to docFrag
    elemList.forEach(elem => {
        docFrag.appendChild(elem);
    });

    return docFrag;
};

// emit event to get friendsList
function requestFriendsList(user) {
    socket.emit('requestFriends', user);
};

// emit event to get meet people list
function requestPeopleList() {
    socket.emit('requestPeopleList');
};

// removes the "current" id if it exists
function removeCurrentFromAll() {
    let currentlySelected = document.getElementById('current');
    if(currentlySelected) {
        currentlySelected.removeAttribute('id');
    };
};

// this is the actual event for the "person" class, which returns the message history with the selected user
function personEvent(e) {
    const targetChildren = e.currentTarget.children;
    const info = targetChildren[0].children;
    const selectedUser = info[0].textContent;
    const activeElement = checkIfActiveConversationBlockExists(selectedUser);

    if(activeElement) {
        // if this conversation is in our active, we want to show that the user has already seen it by removing the "new" class.
        activeElement.setAttribute('class', 'active-conversation');
    };

    // remove the "current" id from the holder element
    removeCurrentFromAll();

    // create a block in the UI with the "current" id
    createActiveConversationBlock(selectedUser, true);

    // generate message history
    requestMessageHistory(selectedUser);
};


// the event responsible for requesting the messaging history for the selected user
function requestMessageHistory(to) {
    const privateMessageInfo = {
        from: currentUserId,
        to
    };
    
    socket.emit('privateMessageHistory', privateMessageInfo);
    messages.innerHTML='';
    setFormState();
};

// adds the event for the message form
function addFormEvent() {
    const form = document.getElementById('message-form');

    form.addEventListener('submit', formSubmitEvent);
};

// the actual event that will be triggered by the message form, in this case it controls 
function formSubmitEvent(e) {
    e.preventDefault();
    const selectedUser = document.getElementById('current').textContent;
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value;

    if(selectedUser !== '' && message !== '') {
        const messageInfo = {
            from: currentUserId,
            to: selectedUser,
            message
        };

        socket.emit('privateMessage', messageInfo);
    };

    // messageInput.value = '';
};

function setFormState() {
    const currentChat = document.getElementById('current');
    const selectedUser = currentChat ? currentChat.textContent : '';
    const messageInput = document.getElementById('message-input');
    if(!selectedUser) {
        messageInput.disabled = true;
    } else {
        messageInput.disabled = false;
    };
};

function formatMessage(msg) {
    const sender = msg.sender.username;
    const date = msg.date;
    const content = msg.content;

    // this is what will represent the message in the UI
    const messageDiv = document.createElement('div');
    const userHeader = createElementAndText('h3', sender);
    const datePara = createElementAndText('p', date);
    const contentPara = createElementAndText('p', content);

    const elemList = [userHeader, datePara, contentPara];
    const docFrag = createDocumentFragment(elemList);

    // add the entirety of docFrag instead of appending one by one
    messageDiv.appendChild(docFrag);
    return messageDiv;
};

// when a person initiates a conversation, it will be put in their active conversations list on top of the messaging window
function populateActiveConversations(conversations) {
    conversations.forEach(user => {
        createActiveConversationBlock(user);
    });
};

// generate active conversation div content to display in the UI
function createActiveConversationBlock(user, currentToggle=false) {
    const activeConversationBlock = checkIfActiveConversationBlockExists(user);
    // we have an array with every user that we currently hold an active conversation with
    if(activeConversationBlock === false) {
        const listElem = document.createElement('li');
        listElem.setAttribute('class', 'active-conversation');

        // if current parameter is true, then we want this to be the selected conversation. this will be used for the person card on-click event.
        if(currentToggle) {
            listElem.setAttribute('id', 'current');
        };

        const content = document.createTextNode(user);
        listElem.appendChild(content);
        listElem.addEventListener('click', activeConversationEvent);
        activeConversations.appendChild(listElem);
    } else {
        if(currentToggle) {
            setCurrentID(user);
        };
    };
};

// this only executes when the user has clicked on a user for whom an active conversation already exists
// iterate over all active conversations and then append the "current" ID on the matching one
function setCurrentID(user) {
    let activeConversationsChildren = activeConversations.children;
    for(let child of activeConversationsChildren) {
        if(child.textContent === user) {
            child.setAttribute('id', 'current');
        };
    };

    // afterwards set form state to true because we now have a user selected
    setFormState();
};

function checkIfActiveConversationBlockExists(user) {
    let activeConversationsChildren = activeConversations.children;

    // check if a block for the user exists, if it does change flag to true, if it doesn't flag stays false
    for(let child of activeConversationsChildren) {
        if(child.textContent === user) {
            return child
        };
    };

    // we will then use this boolean to decide if this user will be appended to the #active-conversations div.
    return false
};

// this is what happens when a user clicks on one of the active conversation blocks
function activeConversationEvent(e) {
    const currentElement = e.target;
    const selectedUser = currentElement.textContent;
    // remove "current" id from holder element and then assign it to the just clicked one
    removeCurrentFromAll();
    currentElement.setAttribute('id', 'current');
    // remove the 'new' class, so the user knows that they've already seen this.
    currentElement.setAttribute('class', 'active-conversation');
    // reset the form state so it is now active, and then request the message history
    setFormState();
    requestMessageHistory(selectedUser);
};

// what happens on receiving and sending a message
function appendMessage(msg) {
    messages.appendChild(formatMessage(msg));
};

// this is here so that the chat will be scrolled to the bottom on every message so the user doesn't have to scroll manually
function scrollToBottom(elem) {
    elem.scrollTop = elem.scrollHeight;
};

addFormEvent();
requestPeopleList();
setFormState();
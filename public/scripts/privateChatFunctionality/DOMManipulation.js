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

    if(selectedUser !== '' && message.trim() !== '') {
        const messageInfo = {
            from: currentUserId,
            to: selectedUser,
            message
        };

        socket.emit('privateMessage', messageInfo);
    };

    messageInput.value = '';
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
    const date = new Date(msg.date).toLocaleString();
    const content = msg.content;

    // this is what will represent the message in the UI
    const messageDiv = document.createElement('div');
    const infoDiv = document.createElement('div');
    infoDiv.setAttribute('class', 'd-flex align-items-center justify-content-between');
    const userHeader = createElementAndText('h3', sender);
    const datePara = document.createElement('p');
    const fineDatePrint = createElementAndText('small', date);
    datePara.appendChild(fineDatePrint);
    const contentPara = createElementAndText('p', content);

    const infoElemList = [
        userHeader,
        datePara
    ];

    const infoFragment = createDocumentFragment(infoElemList);
    infoDiv.appendChild(infoFragment);

    const elemList = [infoDiv, contentPara];
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
        listElem.setAttribute('class', 'active-conversation rounded-0 btn-darker btn');

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

    // we will then use this boolean to decide if this user will be appended to the #active-conversation rounded-0 btn-darker btns div.
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
    currentElement.setAttribute('class', 'active-conversation rounded-0 btn-darker btn');
    // reset the form state so it is now active, and then request the message history
    setFormState();
    requestMessageHistory(selectedUser);
    requestUserProfileData(currentUserName, selectedUser);
};

// what happens on receiving and sending a message
function appendMessage(msg) {
    messages.appendChild(formatMessage(msg));
};

// this is here so that the chat will be scrolled to the bottom on every message so the user doesn't have to scroll manually
function scrollToBottom(elem) {
    elem.scrollTop = 0;
    elem.scrollTop = elem.scrollHeight;
};

function createUserProfile(userObj) {
    // this is what appears below the message window
    // the purpose of this is to know who we are chatting with and also to give us the option to add them as a friend
    const selectedProfile = document.getElementById('selected-profile');
    const userActionsDiv = document.createElement('div');
    userActionsDiv.setAttribute('class', 'd-flex justify-content-between mb-3 align-items-center');
    selectedProfile.innerHTML='';
    let ulLeft = document.createElement('ul');
    ulLeft.setAttribute('class', 'list-unstyled d-flex p-0 m-0')
    const aboutPara = createElementAndText('p', userObj.about);
    const friendBtn = createElementAndText('button', userObj.isFriend ? 'Unfriend' : 'Friend');
    friendBtn.setAttribute('id', 'friend-toggler');
    friendBtn.setAttribute('class', 'btn btn-complement');

    // give the friendBtn its functionality, which is to add a friend to the user's DB object
    friendBtn.addEventListener('click', () => toggleFriend(currentUserName, userObj.username));

    let ulLeftContent = [
        createElementAndText('li', userObj.username),    
        createElementAndText('li', userObj.age),    
        createElementAndText('li', userObj.gender),    
        createElementAndText('li', userObj.location)    
    ];

    ulLeftContent.forEach(item => {
        item.setAttribute('class', 'mr-3');
    });

    let docFragLeft = createDocumentFragment(ulLeftContent);
    ulLeft.appendChild(docFragLeft);

    let userActionsContent = [
        ulLeft,
        friendBtn
    ];

    const userActionsDocFrag = createDocumentFragment(userActionsContent);
    userActionsDiv.appendChild(userActionsDocFrag);

    let selectedContent = [
        userActionsDiv,
        aboutPara
    ];

    let selectedDocFrag = createDocumentFragment(selectedContent);
    selectedProfile.appendChild(selectedDocFrag);
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
    const userObj = {
        username: info[0].textContent,
        age: info[1].textContent,
        gender: info[2].textContent,
        location: info[3].textContent,
        about: targetChildren[1].textContent
    };

    const activeElement = checkIfActiveConversationBlockExists(userObj.username);

    if(activeElement) {
        // if this conversation is in our active, we want to show that the user has already seen it by removing the "new" class.
        activeElement.setAttribute('class', 'active-conversation rounded-0 btn-darker btn');
    };

    // remove the "current" id from the holder element
    removeCurrentFromAll();

    // create a block in the UI with the "current" id
    createActiveConversationBlock(userObj.username, true);

    // generate message history
    requestMessageHistory(userObj.username);

    requestUserProfileData(currentUserName, userObj.username);
};

function generatePersonCard(person) {
    // what will appear for each user
    const container = document.createElement('div');
    container.setAttribute('class', 'person p-3 btn btn-primary w-100 mb-3 text-light text-left');
    const about = createElementAndText('p', person.about || 'Unset');
    const unorderedList = document.createElement('ul');
    unorderedList.setAttribute('class', 'list-unstyled d-flex');
    const listItems = [
        createElementAndText('li', person.username),
        createElementAndText('li', person.age || 'Unset'),
        createElementAndText('li', person.gender || 'Unset'),
        createElementAndText('li', person.location || 'Unset'),
        createElementAndText('li', person.isOnline ? 'Online' : 'Offline')
    ];

    listItems.forEach(item => {
        item.setAttribute('class', 'pr-4');
    });

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

addFormEvent();
setFormState();
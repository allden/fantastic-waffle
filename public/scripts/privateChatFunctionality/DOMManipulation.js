peopleListToggler.addEventListener('click', togglePeopleList);

// adds the event for the message form
function addFormEvent() {
    const form = document.getElementById('message-form');

    form.addEventListener('submit', formSubmitEvent);
};

// the actual event that will be triggered by the message form, in this case it controls 
function formSubmitEvent(e) {
    e.preventDefault();
    const selectedUser = document.getElementById('current') ? document.getElementById('current').textContent : '';
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
    userHeader.classList.add('p-0', 'm-0');
    const datePara = document.createElement('p');
    datePara.classList.add('p-0', 'm-0');
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
    const {username, age, gender, location} = userObj;
    // this is what appears below the message window
    // the purpose of this is to know who we are chatting with and also to give us the option to add them as a friend
    const userActionsDiv = document.createElement('div');
    userActionsDiv.setAttribute('class', 'mb-3 row px-3 align-items-center');
    clearProfile();

    let userInfoElement = document.createElement('p');
    userInfoElement.innerHTML=`
        ${username} <span class="text-primary">/</span>
        ${age} <span class="text-primary">/</span>
        ${gender} <span class="text-primary">/</span> 
        ${location}
      `;
    userInfoElement.setAttribute('class', 'col-md-6 col-xs-12 p-0 mb-xs-3 m-0')

    // ulLeft
    const aboutPara = createElementAndText('p', userObj.about);

    // DROPDOWN START
    let controlDiv = document.createElement('div');
    controlDiv.setAttribute('class', 'col-md-6 col-xs-12 d-flex justify-content-end justify-content-xs-start p-0 m-0');
    // dropdown btn
    const dropdown = createElementAndText('button', 'Options');
    dropdown.setAttribute('class', 'dropdown-toggle btn btn-complement')
    dropdown.setAttribute('data-toggle', 'dropdown');

    const dropdownDiv = document.createElement('div');
    dropdownDiv.setAttribute('class', 'dropdown-menu');
    const friendBtn = createElementAndText('a', userObj.isFriend ? 'Unfriend' : 'Friend');
    // the id is used for the event so that it may change the state afterwards
    friendBtn.setAttribute('id', 'friend-toggler');
    friendBtn.setAttribute('class', 'dropdown-item');

    // give the friendBtn its functionality, which is to add a friend to the user's DB object
    friendBtn.addEventListener('click', () => toggleFriend(currentUserName, userObj.username));

    // responsible for closing the chat window
    const closeBtn = createElementAndText('a', 'Close Chat');
    closeBtn.setAttribute('class', 'dropdown-item');
    
    closeBtn.addEventListener('click', () => {
        clearAll(userObj.username);
    });

    const dropdownDivFragment = createDocumentFragment([friendBtn, closeBtn]);
    dropdownDiv.appendChild(dropdownDivFragment);

    const controlDivFragment = createDocumentFragment([dropdown, dropdownDiv]);
    controlDiv.appendChild(controlDivFragment);

    // DROPDOWN END

    let userActionsContent = [
        userInfoElement,
        controlDiv
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

function clearFromActives(username) {
    const activeConvChildren = activeConversations.children;
    for(let child of activeConvChildren) {
        if(child.textContent === username) {
            child.remove();
        };
    };

    setFormState();
};

function clearMessages() {
    messages.innerHTML='';
};

function clearProfile() {
    selectedProfile.innerHTML='';
};

function clearAll(user) {
    clearMessages();
    clearProfile();
    clearFromActives(user);
};

// removes the "current" id if it exists
function removeCurrentFromAll() {
    let currentlySelected = document.getElementById('current');
    if(currentlySelected) {
        currentlySelected.removeAttribute('id');
    };
};

// this is the actual event for the "person" class, which returns the message history with the selected user
function personEvent(userObj) {
    
    const activeElement = checkIfActiveConversationBlockExists(userObj.username);
    
    if(activeElement) {
        // if this conversation is in our active, we want to show that the user has already seen it by removing the "new" class.
        activeElement.setAttribute('class', 'active-conversation rounded-0 btn-darker btn');
    };
    
    // hide the right div and free space for the chat
    togglePeopleList();

    // remove the "current" id from the holder element
    removeCurrentFromAll();

    // create a block in the UI with the "current" id
    createActiveConversationBlock(userObj.username, true);

    // generate message history
    requestMessageHistory(userObj.username);

    requestUserProfileData(currentUserName, userObj.username);
};

function generatePersonCard(person) {
    const {username, age, gender, location, about} = person;
    // what will appear for each user
    const container = document.createElement('div');
    container.setAttribute('class', 'person p-3 btn btn-primary w-100 mb-3 text-light text-left');
    const aboutElement = createElementAndText('p', about || 'Unset');
    const userInfoElement = document.createElement('p');
    userInfoElement.innerHTML = `
        ${username} <span class="text-support">/</span> 
        ${age} <span class="text-support">/</span> 
        ${gender} <span class="text-support">/</span> 
        ${location} <span class="text-support">/</span> 
        ${person.isOnline ? 'Online' : 'Offline'}
    `;

    // append to our container
    container.appendChild(userInfoElement);
    container.appendChild(aboutElement);

    container.addEventListener('click', () => personEvent(person));

    return container
};

// utility class to create elements with text inside
function createElementAndText(type, text, classList='') {
    const element = document.createElement(type);
    const textNode = document.createTextNode(text);
    element.setAttribute('class', classList);
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

function togglePeopleList() {
    if(!right.style.transform || right.style.transform === "translateX(0px)") {
        peopleListToggler.textContent = 'Show People';
        left.style.transform = "translateX(0px)";
        right.style.transform = "translateX(100%)";
    } else {
        peopleListToggler.textContent = 'Hide People';
        left.style.transform = "translateX(-100%)";
        right.style.transform = "translateX(0px)";
    };
};

addFormEvent();
setFormState();
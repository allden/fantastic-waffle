socket.on('stateChange', () => {
    // we need to wait for this so that we know the promises are finished.
    requestPeopleList();
});

socket.on('activeConversations', unreads => {
    const currentChat = document.getElementById('current');
    // whenever the user connectToChat event is emitted, it returns the activeConversations event with the unread messages
    populateActiveConversations(unreads);
    unreads.forEach(unreadUser => {
        let activeElement = checkIfActiveConversationBlockExists(unreadUser);
        // if there is an existing activeElement
        // AND there is either no currentChat OR there is a currentChat, BUT the textContent is NOT equal to the currently iterated value
        if(activeElement && (!currentChat || (currentChat && currentChat.textContent !== unreadUser))) {
            console.log('ran');
            // compare the active-conversation divs on the screen with the unreadUser we get from our backend and apply the "new" class accordingly.
            activeElement.setAttribute('class','new active-conversation');
            audio.play();
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
        scrollToBottom(chat);
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
    scrollToBottom(chat);
});

socket.on('requestFriends', friends => {
    currentlyViewing = 'friends';
    peopleList.innerHTML='';
    // for every person in the friends array, we create a card for them and then append it to our people list container
    friends.forEach(friend => {
        const card = generatePersonCard(friend);
        peopleList.appendChild(card);
    });
});

socket.on('requestPeopleList', people => {
    currentlyViewing = 'people';
    peopleList.innerHTML='';
    people.forEach(person => {
        const card = generatePersonCard(person);
        peopleList.appendChild(card);
    });
});

socket.on('toggleFriend', (result) => {
    if(currentlyViewing === 'friends') {
        requestFriendsList(currentUserName);
    };

    let friendToggler = document.getElementById('friend-toggler');
    friendToggler.textContent = result;
});

socket.on('requestUserProfileData', userData => {
    createUserProfile(userData);
});
// get friendsList based on username whenever you click on the "friends-btn" button
friendsBtn.addEventListener('click', () => requestFriendsList(currentUserName));
meetPeopleBtn.addEventListener('click', requestPeopleList);

// emit event to get friendsList
function requestFriendsList(user) {
    socket.emit('requestFriends', user);
};

// emit event to get meet people list
function requestPeopleList() {
    socket.emit('requestPeopleList');
};

function requestUserProfileData(requester, target) {
    let requestObj = {
        requester,
        target
    };

    socket.emit('requestUserProfileData', requestObj);
};

function toggleFriend(requester, friend) {
    let requestObj = {
        requester,
        friend
    };

    socket.emit('toggleFriend', requestObj);
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
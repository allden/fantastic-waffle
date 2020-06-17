const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');

module.exports.registration = (req, res) => {
    let {username, password, password2} = req.body;
    let userRegex = /^[A-Za-z0-9]+$/
    let errors = [];

    // validation
    if(!username || !password || !password2) {
        errors.push('Please fill in every field.');
    };

    if(userRegex.test(username) === false) {
        errors.push('Username can only contain alphanumeric symbols.')
    };

    if(password.length < 6) {
        errors.push('Password must be 6 characters or greater.');
    };

    if(password !== password2) {
        errors.push('Passwords must match.');
    };

    User.findOne({username})
    .then(user => {
        if(user) errors.push('Username already exists.');

        if(errors.length > 0) {
            // validation fail
            req.flash('messages', errors);
            res.locals.messages = req.flash('messages');
            res.render('register');
        } else {
            // hash password and save to db
            bcrypt.genSalt(10, (err, salt) => {
                if(err) errHandling(err);

                bcrypt.hash(password, salt, (err, hash) => {
                    if(err) errHandling(err);

                    new User({
                        username,
                        password: hash
                    })
                    .save()
                    .then(() => {
                        // validation success
                        req.flash('messages', 'Registration successful.');
                        res.locals.messages = req.flash('messages');
                        res.render('register');
                    })
                    .catch(err => errHandling(err));
                });
            });
        };
    });
};

module.exports.getSettingsForm = (req, res) => {
    res.render('settings');
};

module.exports.updateSettings = (req, res) => {
    const {username} = req.user;
    const {about, age, gender, country} = req.body;
    let ageRegex = /^[0-9]+$/;
    let genderRegex = /^[A-Za-z]+$/;
    let countryRegex = /^[A-Za-z\s]+$/;

    let errors = [];

    if(ageRegex.test(age) === false) {
        errors.push('Please verify that the age field is correct.');
    };

    if(genderRegex.test(gender) === false) {
        errors.push('Please verify that the gender field is correct.');
    };

    if(countryRegex.test(country) === false) {
        errors.push('Please verify that the country field is correct.');
    };

    if(errors.length > 0) {
        req.flash('messages', errors);
        res.locals.messages = req.flash('messages');
        return res.render('settings', {
            formData: {
                about, 
                age, 
                gender, 
                country
            }
        });
    } else {
        User.findOneAndUpdate({username}, 
        {
            about, 
            age, 
            gender, 
            location: country
        })
        .then(() => {
            req.flash('messages', 'Successfully  updated.');
            res.locals.messages = req.flash('messages');
            return res.render('settings', {
                formData: {
                    about, 
                    age, 
                    gender, 
                    country
                }
            });
        })
        .catch(err => errHandling(err));
    };
};

module.exports.getUsers = (req, res) => {
    return res.render('people');
};

module.exports.getUsersAsync = () => {
    return User.find({})
    .then(users => {
        const userDetails = filterData(users);
        return userDetails
    })
    .catch(err => errHandling(err));
};

module.exports.getFriendsListAsync = (username) => {
    return User.findOne({username})
    .populate('friendsList')
    .then(user => {
        const filteredFriendsList = user.friendsList.map(friend => {
            const {username, about, age, location, isOnline, gender} = friend;
            return {
                username,
                about,
                age,
                gender,
                location,
                isOnline
            };
        });

        return filteredFriendsList;
    })
    .catch(err => errHandling(err));
};

module.exports.changeState = (username, state=false) => {
    return User.findOneAndUpdate({username}, {isOnline: state})
    .then(user => {
        let strState = user.isOnline ? 'online' : 'offline';
        return console.log(user.username, 'is now', strState);
    })
    .catch(err => errHandling(err));
};

module.exports.toggle = (requestObj) => {
    // first we need to get the friend's ID so we can append it to the user object
    return User.findOne({username: requestObj.friend})
    .then(foundFriend => {
        return User.findOne({username: requestObj.requester})
        .then(foundRequester => {
            // if user is already in friendsList, remove them, if not, add them.
            if(foundRequester.friendsList.includes(foundFriend._id)) {
                return User.findOneAndUpdate({username: requestObj.requester}, {$pull: {friendsList: foundFriend._id}})
                .then(() => 'Friend')
                .catch(err => errHandling(err));
            } else {
                return User.findOneAndUpdate({username: requestObj.requester}, {$push: {friendsList: foundFriend._id}})
                .then(() => 'Unfriend')
                .catch(err => errHandling(err));
            };
        })
        .catch(err => errHandling(err));
    })
    .catch(err => errHandling(err));
};

module.exports.findSpecificUser = (requester, target) => {
    return User.findOne({username: target})
    .then(foundTarget => {
        return User.findOne({username: requester})
        .then(foundRequester => {
            // i honestly could not think of a better way to change the button state between "add friend" and "remove friend",
            // you may have noticed this already, but this app is made with duct tape and determination
            let userData = filterUserData(foundTarget.toObject());
            let isFriend = foundRequester.friendsList.includes(foundTarget._id);
            return {
                isFriend,
                ...userData
            }
        })
        .catch(err => errHandling(err));
    })
    .catch(err => errHandling(err));
};

function filterData(users) {
    const data = users.map(user => {
        const {username, about, age, location, gender, isOnline} = user;
        return {
            username,
            about,
            age,
            location,
            gender,
            isOnline
        };
    });

    return data;
};

function filterUserData(user) {
    const {password, friendsList, ...misc} = user;
    return misc;
};

function errHandling(err) {
    return console.error(err);
};
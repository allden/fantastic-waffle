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
    const {name} = req.params;
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
        res.render('settings', {
            formData: {
                about, 
                age, 
                gender, 
                country
            }
        });
    };

    User.findOneAndUpdate({username: name}, 
    {
        about, 
        age, 
        gender, 
        location: country
    })
    .then(() => {
        req.flash('messages', 'Successfully  updated.');
        res.locals.messages = req.flash('messages');
        res.render('settings', {
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

module.exports.getUsers = (req, res) => {
    User.find({})
    .then(users => {
        res.render('people', {users})
    })
    .catch(err => errHandling(err));
};

function errHandling(err) {
    return console.error(err);
};
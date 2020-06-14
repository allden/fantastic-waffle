const express = require('express');
const router = express.Router();
const passport = require('passport');

// public room controller
const publicRoomController = require('./controllers/publicInstanceController');
const userController = require('./controllers/userController');

// user controllers
router.get('/settings', checkAuth, userController.getSettingsForm);
router.post('/settings', checkAuth, userController.updateSettings);

// room controllers
router.get('/room/:title', checkAuth, publicRoomController.getSpecificRoom);

router.get('/people', checkAuth, userController.getUsers);

router.get('/rooms', checkAuth, publicRoomController.getAllPublicRooms);
router.get('/room', checkAuth, publicRoomController.getPublicRoomForm);
router.post('/room', checkAuth, publicRoomController.createPublicRoom);

// register
router.get('/register', (req, res) => {
    return res.render('register');
});

router.post('/register', userController.registration);

// login
router.get('/login', (req, res) => {
    return res.render('login');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

// logout
router.get('/logout', checkAuth, (req, res) => {
    req.logout();
    return res.redirect('/');
});

router.get('/', (req, res) => {
    return res.render('index');
});

function checkAuth(req, res, next) {
    if(!req.isAuthenticated || !req.isAuthenticated()) {
        req.flash('messages', 'You need to be logged in to do that.');
        return res.redirect('/');
    } else {
        next();
    };
};

module.exports = router;
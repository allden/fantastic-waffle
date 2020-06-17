require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const PORT = process.env.PORT || 5000;

// mongoose
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false})
.then(() => console.log('mongodb successfully established conneection.'))
.catch(err => console.error(err));

// routes
const routeControl = require('./routeControl.js');

// session, passport and flash
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');

// websockets
const io = require('socket.io')(http);

// initialize socket configuration
require('./socketConfig')(io);

// view engine
app.set('view engine', 'ejs');

// middleware
app.use(session({secret: process.env.SECRET, resave: false, saveUninitialized: false}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
require('./passportConfig')();

app.use(express.static('public'));
// access to json and urlencoded
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use((req, res, next) => {
    res.locals.messages = req.flash('messages');
    res.locals.errors = req.flash('error');
    res.locals.user = req.user;
    next();
});

app.use(routeControl);

http.listen(PORT, () => {
    console.log(`App is running on ${PORT}`);
});
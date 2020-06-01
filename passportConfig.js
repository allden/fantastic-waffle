const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/UserModel');
const bcrypt = require('bcryptjs');

module.exports = () => {
    passport.use(new LocalStrategy((username, password, done) => {
        User.findOne({username})
        .then(user => {
            if(!user) return done(null, false, {message: 'Please verify that your username and password are correct.'});
            bcrypt.compare(password, user.password, (err, match) => {
                if(err) return done(err);
                if(!match) return done(null, false, {message: 'Please verify that your username and password are correct.'});
                
                return done(null, user);
            });
        })
        .catch(err => {
            return done(err);
        });
    }));

    passport.serializeUser((user, done) => {
        return done(null, user.id);
      });
      
    passport.deserializeUser((id, done) => {
        User.findById(id, function(err, user) {
            return done(err, user);
        });
    });
};
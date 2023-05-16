"use strict";
let LocalStrategy = require('passport-local').Strategy;
let User = require('../models/User');
let {compare} = require("bcrypt");

module.exports = function(passport) {
    passport.use(new LocalStrategy(
        async (username, password, done) => {
            try {
                let user = await User.findOne({where: {username}});
                if (!user) {
                    return done(null, false, { message: 'Username не зарегистрирован' });
                }
                const isPasswordValid = await compare(password, user.password);
                if (!isPasswordValid) {
                    return done(null, false, { message: 'Неверный пароль' });
                }
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            let user = await User.findByPk(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};
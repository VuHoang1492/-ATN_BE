const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy
const bcrypt = require('bcrypt')
const { v6 } = require('uuid')
require('dotenv').config()

const Auth = require('../models/auth.model.js')
const User = require('../models/user.model.js');
const { localRegister } = require('../controllers/auth.controller.js');



module.exports = () => {
    passport.serializeUser((user_id, done) => {
        done(null, user_id);
    });

    passport.deserializeUser((user, done) => {
        User.findById(user, (err, data) => {
            if (err) {
                done(err, null);
                return
            }

            done(null, data[0]);
        })
    });




    passport.use('local', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function verify(email, password, cb) {

        Auth.searchLocalAuthByEmail(email, async (err, data) => {
            if (err) return cb({ code: 500, msg: 'Có lỗi xảy ra!' }, null);

            if (!data.length) { return cb({ code: 401, msg: 'Email hoặc mật khẩu không chính xác!' }, null); }
            //Xác minh mật khẩu
            const user = data[0]
            const matchPassword = await bcrypt.compare(password, user.password)
            if (matchPassword) {
                return cb(null, { user_id: user.user_id });
            }

            return cb({ code: 401, msg: 'Email hoặc mật khẩu không chính xác!' }, null);
        })
    }));

    passport.use('google', new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/google/login/callback'
    },
        function (accessToken, refreshToken, profile, cb) {

            Auth.findSocialAuthByProfileId(profile.id, 'google', (err, data) => {

                if (err) return cb({ msg: 'Có lỗi xảy ra!' }, null);
                if (!data.length) {

                    //Tạo social auth
                    const user = {
                        auth_id: v6(),
                        user_id: v6(),
                        profile_id: profile.id,
                        provider: 'google'
                    }

                    User.create(user.user_id, profile.displayName, profile.emails[0].value, 'social', (err, data) => {
                        if (err) return cb({ msg: 'Có lỗi xảy ra!' }, null);

                        Auth.createSocialAuth(user, (err, data) => {
                            if (err) return cb({ msg: 'Có lỗi xảy ra!' }, null);
                            return cb(null, user.user_id)
                        })
                    })
                } else {
                    return cb(null, data[0].user_id)
                }
            })
        }
    ));


    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: '/facebook/login/callback',
        profileFields: ['id', 'displayName', 'photos', 'email'],
        scope: ['email'],
        state: true
    }, function verify(accessToken, refreshToken, profile, cb) {

        Auth.findSocialAuthByProfileId(profile.id, 'facebook', (err, data) => {

            if (err) return cb({ msg: 'Có lỗi xảy ra!' }, null);
            if (!data.length) {

                //Tạo social auth
                const user = {
                    auth_id: v6(),
                    user_id: v6(),
                    profile_id: profile.id,
                    provider: 'facebook'
                }

                User.create(user.user_id, profile.displayName, profile.emails[0].value, 'social', (err, data) => {
                    if (err) return cb({ msg: 'Có lỗi xảy ra!' }, null);

                    Auth.createSocialAuth(user, (err, data) => {
                        if (err) return cb({ msg: 'Có lỗi xảy ra!' }, null);
                        return cb(null, user.user_id)
                    })
                })
            } else {
                return cb(null, data[0].user_id)
            }
        })

    }));



} 
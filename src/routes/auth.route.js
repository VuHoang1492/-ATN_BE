const express = require('express')
const authController = require('../controllers/auth.controller.js')
const passport = require('passport')

const route = express.Router()

route.post('/local/login', authController.localLogin)
route.post('/local/register', authController.localRegister)



route.get('/:provider/login', authController.socialLogIn)

route.get('/google/login/callback', passport.authenticate('google', { failureRedirect: '/login/failed', successRedirect: '/login/success' }));

route.get('/facebook/login/callback', passport.authenticate('facebook', { failureRedirect: '/login/failed', successRedirect: '/login/success' }));


route.get('/login/success', (req, res) => {
    res.send(` <script>
        window.opener.postMessage('SUCCESS', '*');
        window.close();
       </script>`)
})

route.get('/login/failed', (req, res) => {
    res.send(` <script>
        window.opener.postMessage('FAILED', '*');
        window.close();
       </script>`)
})



route.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).send('Logout failed');
        }

        req.session.destroy()
        res.clearCookie('connect.sid', { path: '/' })
        res.send('LOG OUT')
    })
})

route.post('/change-password', authController.changePassword)

route.post('/request-otp', authController.sendCode)
route.post('/forget-password', authController.forgetPassword)

route.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(req.user);
    } else {
        res.clearCookie('connect.sid', { path: '/' })
        res.status(401).send("Unauthorized");
    }
})

module.exports = route
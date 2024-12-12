const express = require('express')
const cors = require('cors')
const session = require('express-session');
require('dotenv').config()

const sessionStore = require('./src/config/sessionStore.js')
const passport = require('passport')
const passportConfig = require('./src/config/passport.js')


const authApi = require('./src/routes/auth.route.js');
const accomApi = require('./src/routes/accommodation.route.js')
const reviewApi = require('./src/routes/review.route.js')
const checkDbConnection = require('./src/middlewares/checkDbConnection.js');

const port = process.env.PORT

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors({ credentials: true, origin: process.env.WEB_URL }))

passportConfig()

// Middleware to check MySQL status
app.use(checkDbConnection);

app.use(session({
    secret: 'MySecret',
    cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: false },
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

//Api
app.use(authApi)
app.use('/accommodation', accomApi)
app.use('/review', reviewApi)

app.get('/', (req, res) => {
    console.log(req.user);
    res.send('hello world')
})

app.listen(port, () => {
    console.log(`App running on port ${port}!`);

})
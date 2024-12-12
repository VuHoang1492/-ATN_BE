const db = require('./database.js')
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({
    checkExpirationInterval: 15 * 60 * 1000,// How frequently expired sessions will be cleared; milliseconds.
    expiration: 24 * 60 * 60 * 1000,// The maximum age of a valid session; milliseconds.
    createDatabaseTable: true,// Whether or not to create the sessions database table, if one does not already exist.
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}, db);

module.exports = sessionStore

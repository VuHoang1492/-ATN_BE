const db = require('../config/database.js')

const User = {
    findById: (id, done) => {
        db.execute('SELECT * FROM user WHERE user_id = ? ', [id], (err, rows, fields) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },
    create: (id, name, email, type, done) => {
        db.execute('INSERT INTO user (user_id, name, email,type, create_at) VALUES (?,?,?,?, CURRENT_TIMESTAMP()) ', [id, name, email, type], (err, rows, fields) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },
    updateLastPostTime: (id, done) => {
        db.execute('UPDATE user SET last_post=CURRENT_TIMESTAMP() WHERE user_id=?', [id], (err, rows, field) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },

    getLastPostTime: (id, done) => {
        db.execute('SELECT last_post FROM user WHERE user_id=?', [id], (err, rows, field) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },
}

module.exports = User
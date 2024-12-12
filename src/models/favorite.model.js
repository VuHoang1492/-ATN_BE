const db = require('../config/database.js')
const moment = require('moment-timezone')
/* done is callback fuction from controller has 2 parameter: err, data */


const Favorite = {
    create: (id, user_id, post_id, done) => {
        db.execute('INSERT INTO favorite (id, user_id, post_id) VALUES (?,?,?)', [id, user_id, post_id], (err, result) => {
            if (err) {
                done(err, null)
                return
            }

            done(null, result)
        })
    },
    delete: (user_id, post_id, done) => {
        db.execute('DELETE FROM favorite WHERE user_id=? AND post_id=?', [user_id, post_id], (err, result) => {
            if (err) {
                done(err, null)
                return
            }

            done(null, result)
        })
    },
    findByUserId: (user_id, cursor, done) => {
        const comand = `
        SELECT p.*,
        GROUP_CONCAT(f.file_id) as file_id,
        GROUP_CONCAT(f.type) as type_file, 
        GROUP_CONCAT(f.key_file) as key_file
        FROM favorite fav
        LEFT JOIN post p ON p.post_id = fav.post_id
        LEFT JOIN files f ON fav.post_id = f.post_id
        WHERE fav.user_id = ? AND p.modified_at < ?
        GROUP BY p.post_id ORDER BY p.modified_at DESC LIMIT 5
        `
        db.execute(comand, [user_id, moment(cursor).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')], (err, rows) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },
}

module.exports = Favorite
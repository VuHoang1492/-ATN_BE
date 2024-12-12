const db = require('../config/database.js')
const moment = require('moment-timezone')
/* done is callback fuction from controller has 2 parameter: err, data */



const ReviewModel = {
    create: (data, done) => {
        db.execute(`INSERT INTO review ( post_id, user_id, rating, image, content, modified_at) VALUES
                    (?,?,?,?,?,CURRENT_TIMESTAMP())`, [data.post_id, data.user_id, data.rating, data.image, data.content],
            (err, result) => {
                if (err) {
                    done(err, null)
                    return
                }
                done(null, result)
            })
    },
    update: (data, done) => {
        db.execute(`UPDATE review SET image= ?, rating= ?, content=? , modified_at=CURRENT_TIMESTAMP() WHERE user_id=? AND post_id=? `, [data.image, data.rating, data.content, data.user_id, data.post_id],
            (err, result) => {
                if (err) {
                    done(err, null)
                    return
                }
                done(null, result)
            }
        )
    },
    countReviewOfPost: (post_id, rating, done) => {
        let command = `SELECT COUNT(*) AS total FROM review WHERE post_id= ?`
        const param = [post_id]
        if (rating && +rating !== 0) {
            command += ` AND rating = ?`
            param.push(rating)
        }
        db.execute(command, param, (err, rows) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },


    getReviewOfUser: (user_id, post_id, done) => {
        db.execute(`SELECT r.* FROM review r WHERE r.user_id=? AND r.post_id=?`, [user_id, post_id], (err, rows) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },
    filter: (rating, post_id, cursor, done) => {
        const param = [post_id]
        let command = `SELECT r.*,u.name 
                        FROM review r
                        LEFT JOIN user u ON u.user_id = r.user_id WHERE r.post_id = ?`

        if (rating && +rating !== 0) {
            command += ` AND r.rating = ?`
            param.push(rating)
        }
        if (cursor) {
            command += ` AND r.modified_at < ?`;
            let tz = moment(cursor).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')
            param.push(tz);
        }
        command += ` ORDER BY r.modified_at  DESC LIMIT 5`

        console.log(command, param);

        db.execute(command, param,
            (err, rows) => {
                if (err) {
                    done(err, null)
                    return
                }
                done(null, rows)
            })
    },
}

module.exports = ReviewModel
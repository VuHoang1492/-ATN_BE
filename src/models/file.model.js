const db = require('../config/database.js')

const File = {

    create: (data, done) => {
        db.execute('INSERT INTO files (file_id, post_id, key_file ,type, create_at, modified_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()) ', [data.file_id, data.post_id, data.key, data.type], (err, rows, fields) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },

    findByPostId: (id, done) => {
        db.execute(`SELECT * FROM files WHERE post_id=?`,
            [id],
            (err, rows, field) => {
                if (err) {
                    done(err, null)
                    return
                }
                done(null, rows)
            }
        )
    },

    // deleteByPostId: (id, done) => {
    //     db.execute(`DELETE FROM files WHERE post_id=?`,
    //         [id],
    //         (err, result) => {
    //             if (err) {
    //                 done(err, null)
    //                 return
    //             }
    //             done(null, result)
    //         }
    //     )
    // },

    deleteByFileId: (id, done) => {
        db.execute(`DELETE FROM files WHERE file_id=?`,
            [id],
            (err, result) => {
                if (err) {
                    done(err, null)
                    return
                }
                done(null, result)
            }
        )
    }
}

module.exports = File
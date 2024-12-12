const db = require('../config/database.js')
const moment = require('moment-timezone')
/* done is callback fuction from controller has 2 parameter: err, data */


const AccommodationModel = {
    create: (data, done) => {
        db.execute(`INSERT INTO post (post_id, user_id, title, price, description, detail_address, type, option, coord_lat, coord_lon, province, district, commune,contact, create_at, modified_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())`,
            [data.post_id, data.user_id, data.title, data.price, data.description, data.detail_address, data.type, data.option, data.coord_lat, data.coord_lon, data.province, data.district, data.commune, data.contact],
            (err, result) => {
                if (err) {
                    done(err, null)
                    return
                }
                done(null, result)
            }
        )
    },
    // getAllByUserId: (user_id, cursor, done) => {


    //     let query = `SELECT * FROM post WHERE user_id = ?`;
    //     const params = [user_id];
    //     if (cursor) {
    //         query += ` AND modified_at < ?`;
    //         let tz = moment(cursor).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')
    //         params.push(tz);
    //     }
    //     query += ` ORDER BY modified_at DESC LIMIT 5`;
    //     db.execute(query, params, (err, rows, fields) => {
    //         if (err) {
    //             done(err, null);
    //             return;
    //         }

    //         done(null, rows);
    //         console.log(rows);

    //     });
    // },

    getAllByUserId: (user_id, cursor, done) => {
        let query = `SELECT p.*, 
        GROUP_CONCAT(f.file_id) as file_id,
        GROUP_CONCAT(f.type) as type_file, 
        GROUP_CONCAT(f.key_file) as key_file
        FROM post p 
        LEFT JOIN files f ON p.post_id = f.post_id
        WHERE user_id = ?`;
        const params = [user_id];
        if (cursor) {
            query += ` AND p.modified_at < ?`;
            let tz = moment(cursor).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')
            params.push(tz);
        }
        query += ` GROUP BY p.post_id ORDER BY p.modified_at DESC LIMIT 5`;
        db.execute(query, params, (err, rows, fields) => {
            if (err) {
                done(err, null);
                return;
            }

            done(null, rows);
        });
    },

    findByPostId: (id, user_id, done) => {
        if (!user_id) {
            user_id = 'UNDEFINED_USER'
        }
        db.execute(`SELECT p.*, 
            GROUP_CONCAT(f.file_id) as file_id,
            GROUP_CONCAT(f.type) as type_file, 
            GROUP_CONCAT(f.key_file) as key_file ,
            CASE
                WHEN fav.user_id IS NOT NULL THEN TRUE
                ELSE FALSE
            END AS isFavorite
            FROM post p 
            LEFT JOIN favorite fav ON fav.user_id = ? AND fav.post_id = p.post_id
            LEFT JOIN files f ON p.post_id = f.post_id 
            WHERE p.post_id= ? GROUP BY p.post_id`, [user_id, id], (err, rows) => {
            if (err) {
                done(err, null)
                return
            }

            done(null, rows)
        })
    },

    //Lấy 1 đối tượng phù hợp sau khi user xóa
    getOne: (user_id, cursor, done) => {
        let query = `
        SELECT p.*,
            GROUP_CONCAT(f.file_id) as file_id,
            GROUP_CONCAT(f.type) as type_file, 
            GROUP_CONCAT(f.key_file) as key_file ,
            CASE
                WHEN fav.user_id IS NOT NULL THEN TRUE
                ELSE FALSE
            END AS isFavorite
        FROM post p
        LEFT JOIN favorite fav ON fav.user_id = ? AND fav.post_id = p.post_id
        LEFT JOIN files f ON p.post_id = f.post_id 
        WHERE p.user_id = ?`;
        const params = [user_id, user_id];

        query += ` AND p.modified_at < ?`;
        let tz = moment(cursor).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')
        params.push(tz);

        query += ` GROUP BY p.post_id ORDER BY p.modified_at DESC LIMIT 1`;
        console.log(query, params);

        db.execute(query, params, (err, rows, fields) => {
            if (err) {
                done(err, null);
                return;
            }

            done(null, rows);
        });
    },

    delete: (post_id, done) => {
        db.execute('DELETE FROM post WHERE  post_id=?', [post_id], (err, result) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, result)
        })
    },

    update: (data, post_id, done) => {
        db.execute(`UPDATE post SET title = ?, price = ?, description = ?, detail_address = ?, type = ?, option = ?, coord_lat = ?, coord_lon = ?, province = ?, district = ?, commune = ?, contact = ?, modified_at = CURRENT_TIMESTAMP() 
            WHERE post_id = ?`,
            [data.title, data.price, data.description, data.detail_address, data.type, data.option, data.coord_lat, data.coord_lon, data.province, data.district, data.commune, data.contact, post_id],
            (err, result) => {
                if (err) {
                    done(err, null)
                    return
                }
                done(null, result)
            }
        )
    },
    filter: (query, cursor, user_id, done) => {
        //build command
        if (!user_id) {
            user_id = 'UNDEFINEED_USER'
        }
        let command = `SELECT p.*,
            GROUP_CONCAT(f.file_id) as file_id,
            GROUP_CONCAT(f.type) as type_file, 
            GROUP_CONCAT(f.key_file) as key_file,
                 CASE
                     WHEN fav.user_id IS NOT NULL THEN TRUE
                     ELSE FALSE
                 END AS isFavorite
            FROM post p 
            LEFT JOIN favorite fav ON fav.user_id = ? AND fav.post_id = p.post_id
            LEFT JOIN files f ON p.post_id = f.post_id  WHERE 1=1`

        const param = [user_id]
        if (query.province) {
            command += ' AND p.province = ?';
            param.push(query.province);
        }
        if (query.district) {
            command += ' AND p.district = ?';
            param.push(query.district);
        }
        if (query.commune) {
            command += ' AND p.commune = ?';
            param.push(query.commune);
        }
        if (query.price) {
            command += ' AND p.price BETWEEN ? AND ?';
            param.push(+query.price - 500000 > 0 ? +query.price - 500000 : 0);
            param.push(+query.price + 500000)
        }

        if (query.type) {
            command += ` AND p.type IN (${query.type})`
        }
        if (query.option) {
            query.option.forEach(o => {
                command += ' AND FIND_IN_SET(?, p.option) > 0'
                param.push(o)
            })
        }
        if (cursor) {
            command += ` AND p.modified_at < ?`;
            let tz = moment(cursor).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')
            param.push(tz);
        }
        command += ` GROUP BY p.post_id ORDER BY p.modified_at DESC LIMIT 5`;

        console.log(command);

        db.execute(command, param, (err, rows) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })

    },
    filterDistance: (query, done) => {
        const param = [query.lat, query.lat, query.lon]
        let command = `
            SELECT p.post_id, p.title, p.type, p.price, p.coord_lat, p.coord_lon, 
            (SELECT f.key_file FROM files f WHERE f.post_id = p.post_id AND f.type= 'image' LIMIT 1) AS key_file ,
            2* 6371 * ASIN( SQRT( (1-COS( RADIANS(p.coord_lat) - ? ) + COS(?) * COS(RADIANS(p.coord_lat)) * (1 - COS(RADIANS(p.coord_lon) -  ? )) ) / 2 ) ) AS distance
            FROM post p`

        if (query.type) {
            command += ` WHERE p.type IN (${query.type})`
        }
        command += ` HAVING distance <=? ORDER BY distance`

        param.push(query.distance)


        db.execute(command, param, (err, rows) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })

    },
    updateRating: (post_id, done) => {
        db.execute(`UPDATE post SET rating = ( SELECT ROUND(AVG(rating), 1) FROM review WHERE review.post_id = ? ) WHERE post.post_id=?`, [post_id, post_id], (err, result) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, result)
        })
    }
}

module.exports = AccommodationModel
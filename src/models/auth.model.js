const db = require('../config/database.js')

/* done is callback fuction from controller has 2 parameter: err, data */

const Auth = {
    searchLocalAuthByEmail: (email, done) => {
        db.execute('SELECT * FROM local_auth WHERE email = ?', [email], (err, rows, field) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },

    searchLocalAuthByUserId: (id, done) => {
        db.execute('SELECT * FROM local_auth WHERE user_id = ?', [id], (err, rows, field) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },

    createLocalAuth: (data, done) => {
        db.execute(`INSERT INTO local_auth (auth_id, user_id, email, password, create_at, update_at) 
                    VALUES(?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())`, [data.auth_id, data.user_id, data.email, data.password], (err, rows, field) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },


    findSocialAuthByProfileId: (profile_id, provider, done) => {
        db.execute('SELECT * FROM social_auth WHERE profile_id = ? AND provider = ?', [profile_id, provider], (err, rows, field) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },

    createSocialAuth: (data, done) => {
        db.execute(`INSERT INTO social_auth (auth_id, user_id, profile_id, provider, create_at, update_at) 
            VALUES(?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())`, [data.auth_id, data.user_id, data.profile_id, data.provider], (err, rows, field) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },

    updateOpt: (code, email, done) => {
        db.execute('UPDATE local_auth SET otp_code=?, otp_create_at=CURRENT_TIMESTAMP() WHERE email=?', [code, email], (err, rows, field) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },

    deleteOpt: (email, done) => {
        db.execute('UPDATE local_auth SET otp_code=NULL, otp_create_at=NULL WHERE email=?', [email], (err, rows, field) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    },

    updatePassword: (email, password, done) => {
        db.execute('UPDATE local_auth SET password=? WHERE email=?', [password, email], (err, rows, field) => {
            if (err) {
                done(err, null)
                return
            }
            done(null, rows)
        })
    }

}

module.exports = Auth
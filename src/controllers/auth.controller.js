const bcrypt = require('bcrypt')
const { v6 } = require('uuid')
const passport = require('passport')

const User = require('../models/user.model.js')
const Auth = require('../models/auth.model.js')


const sendMail = require('../config/nodemailer.js')

const saltRound = 10

const authController = {
    localLogin: (req, res) => {

        if (req.isAuthenticated()) {
            res.status(400).send({ msg: 'Bạn đã đăng nhập!' })
            return
        }

        const { email, password } = req.body

        console.log(email, password);


        if (!email || !password) {
            res.status(400).send({ msg: 'Email hoặc mật khẩu không hợp lệ!' })
            return
        }


        passport.authenticate('local', (err, user) => {
            if (err) {
                console.log('ERR:', err);
                res.status(err.code).send({ msg: err.msg })
                return
            }
            User.findById(user.user_id, (err, data) => {
                if (err) {
                    res.setStatus(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }

                req.login(user.user_id, (err) => {
                    if (err) {
                        return res.status(500).send({ msg: 'Có lỗi xảy ra!' });
                    }

                    res.status(200).send(data[0]);
                });
            })

        })(req, res)
        return


    },

    localRegister: (req, res) => {
        const { email, password } = req.body

        if (!email || !password) {
            res.status(400).send({ msg: 'Email hoặc mật khẩu không hợp lệ!' })
            return
        }

        Auth.searchLocalAuthByEmail(email, async (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            //Nếu có email nào tìm thấy
            if (data.length) {
                res.status(400).send({ msg: 'Email này đã tồn tại!' })
                return
            }

            //Tạo auth_local
            const user = {
                auth_id: v6(),
                user_id: v6(),
                email: email,
                password: await bcrypt.hashSync(password, saltRound)
            }
            //Tạo user mới
            User.create(user.user_id, user.email, user.email, 'local', (err, data) => {
                if (err) {
                    console.error(err);
                    res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }

                //Create local auth profile
                Auth.createLocalAuth(user, (err, data) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                        return
                    }

                    res.send({
                        data: { msg: 'Đăng ký thành công!' }
                    })
                })
            })

        })


    },

    socialLogIn: (req, res) => {
        const provider = req.params.provider
        console.log(provider);

        if (provider === 'google') {
            return passport.authenticate('google', { scope: ['openid', 'profile', 'email'] })(req, res)
        }
        if (provider === 'facebook') {
            return passport.authenticate('facebook')(req, res)
        }

        return res.status(400).send({ msg: 'No support!' })
    },

    sendCode: (req, res) => {
        const { email } = req.body
        if (!email) {
            res.status(400).send({ msg: 'Email hoặc mật khẩu không hợp lệ!' })
            return
        }

        console.log(email);


        Auth.searchLocalAuthByEmail(email, (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }
            if (!data.length) {
                res.status(400).send({ msg: 'Mail này chưa đăng ký tài khoản!' })
                return
            }

            const code = Math.floor(Math.random() * 1000000)

            Auth.updateOpt(code, email, (err, data) => {
                if (err) {
                    console.error(err);
                    res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }

                res.status(200).send({ data: { msg: 'Successful!' } })
            })

            sendMail(email, code, (err, info) => {
                if (err) {
                    console.log(err);
                    return
                }
            })

        })
    },


    forgetPassword: (req, res) => {
        const { email, code, password } = req.body

        if (!email || !code || !password) {
            res.status(400).send({ msg: 'Thông tin không hợp lệ!' })
            return
        }

        Auth.searchLocalAuthByEmail(email, async (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            if (!data.length) {
                res.status(401).send({ msg: 'Email không tồn tại!' })
                return
            }

            if (+ data[0].otp_code !== +code) {
                res.status(401).send({ msg: 'Mã OTP không chính xác!' })
                return
            }

            const date = new Date(data[0].otp_create_at)
            const now = new Date()
            const deltaSecond = (now - date) / 1000

            if (deltaSecond > 60) {
                res.status(401).send({ msg: 'Mã OTP đã hết hạn!' })
                return
            }

            const match = await bcrypt.compare(password, data[0].password)
            if (match) {
                res.status(401).send({ msg: 'Mật khẩu không được phép trùng với mật khẩu cũ!' })
                return
            }

            const newPassword = await bcrypt.hashSync(password, saltRound)

            Auth.updatePassword(email, newPassword, (err, data) => {
                if (err) {
                    console.error(err);
                    res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }
                res.send({ msg: 'Successful!' })
                return
            })

            Auth.deleteOpt(email, (err, data) => {
                if (err) {
                    console.log(err);
                }
            })
        })

    },

    changePassword: (req, res) => {
        if (!req.isAuthenticated()) {
            res.status(400).send({ msg: 'Bạn chưa đăng nhập!' })
        }

        const { oldPassword, newPassword } = req.body

        const id = req.user.user_id

        Auth.searchLocalAuthByUserId(id, async (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            if (!data.length) {
                res.status(400).send({ msg: 'Email không tồn tại!' })
                return
            }

            const user = data[0]
            const matchPassword = await bcrypt.compare(oldPassword, user.password)

            if (!matchPassword) {
                res.status(401).send({ msg: 'Mật khẩu không chính xác!' })
                return
            }

            const newHash = await bcrypt.hashSync(newPassword, saltRound)

            Auth.updatePassword(user.email, newHash, (err, data) => {
                if (err) {
                    console.error(err);
                    res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }
                res.send({ msg: 'Successful!' })
                return
            })


        })

    }
}


module.exports = authController
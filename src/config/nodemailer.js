const nodemailer = require("nodemailer");
require('dotenv').config()

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.MAILER,
        pass: process.env.MAIL_PASSWORD,
    },
});

module.exports = (email, code, done) => {
    console.log(process.env.MAIL_PASSWORD);

    return transporter.sendMail({
        from: '"Stay Here"',
        to: email,
        subject: 'STAY HERE',
        html: `<div style='font-size:16px;'>Code của bạn: <b style='font-size:20px;'>${code}</b></div>`
    }, (err, info) => {
        if (err) {
            done(err, null)
            return
        }
        done(null, info)
    })
}
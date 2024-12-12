const express = require('express')

const route = express.Router()

const ReviewController = require('../controllers/review.controller.js')

const multer = require('multer')
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } })


route.get('/', ReviewController.getAllByPostId)

//Route need authenticate
route.use((req, res, next) => {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.status(401).send("Unauthorized");
    }
})

route.post('/update/:post_id', upload.single('file'), ReviewController.update)

module.exports = route
const express = require('express')

const route = express.Router()

const accomController = require('../controllers/accommodation.controller.js');
const multerMiddleware = require('../middlewares/multer.js')

//Route dont need authenticate

route.get('/get', accomController.getById)

route.get('/filter', accomController.filter)

route.get('/filter-map', accomController.filterOnMap)

//Route need authenticate
route.use((req, res, next) => {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.status(401).send("Unauthorized");
    }
})

route.get('/fav', accomController.getFav)

route.post('/favorite/:action', accomController.favorite)

route.get('/my-accom', accomController.getAll)

route.post('/create', multerMiddleware, accomController.create)

route.delete('/delete', accomController.delete)

route.get('/update', accomController.getUpdate)
route.post('/update/:post_id', multerMiddleware, accomController.postUpdate)

module.exports = route
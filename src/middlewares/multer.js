const multer = require('multer')
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 100 * 1024 * 1024 } }).array('files[]')


module.exports = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.log(err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                res.status(400).send({ msg: 'Kích thước file quá lớn! Tối đa 100mb!' });
                return
            }
            res.status(500).send({ msg: 'Có lỗi xảy ra!' });
            return
        } else if (err) {
            res.status(500).send({ msg: 'Có lỗi xảy ra!' });
            return
        }
        next()
    })
}
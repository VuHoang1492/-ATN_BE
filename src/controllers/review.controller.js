const store = require("../config/S3")
const AccommodationModel = require("../models/accommodation.model")
const ReviewModel = require("../models/review.model")

const ReviewController = {
    getAllByPostId: (req, res) => {
        const { post_id, rate, cursor } = req.query
        console.log(cursor);

        const user_id = req.user?.user_id

        ReviewModel.filter(rate, post_id, cursor, async (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            const list = await Promise.all(rows.map(async review => {
                if (review.image) {
                    review.image = await store.getUrl(review.image)
                }
                return review
            }))

            ReviewModel.countReviewOfPost(post_id, rate, (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }


                if (!user_id) {
                    res.send({ rv: {}, list: list, total: result[0]?.total, cursor: list.length ? list[list.length - 1].modified_at : cursor })
                    return
                }
                ReviewModel.getReviewOfUser(user_id, post_id, async (err, rows) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                        return
                    }

                    const review = rows[0]
                    if (!review) {
                        res.send({ rv: {}, list: list, total: result[0]?.total, cursor: list.length ? list[list.length - 1].modified_at : cursor })
                        return
                    }

                    if (review.image) {
                        review.key_image = review.image
                        review.url = await store.getUrl(review.image)
                    } else {
                        review.key_image = null
                        review.url = null
                    }

                    delete review.image

                    res.send({ rv: review, list: list, total: result[0]?.total, cursor: list.length ? list[list.length - 1].modified_at : cursor })
                    return
                })

            })


        })




    },

    update: (req, res) => {
        const { rating, content, old_file } = req.body
        const { post_id } = req.params
        const user_id = req.user.user_id
        const file = req.file


        if (![0, 1, 2, 3, 4, 5].includes(+rating)) {
            res.status(400).send({ msg: 'Bad rating!' })
            return
        }

        AccommodationModel.findByPostId(post_id, user_id, async (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            if (!rows.length) {
                res.status(400).send({ msg: 'Bài viết không tồn tại!' })
                return
            }

            let raw = {}
            //Xóa file cũ lưu file mới
            try {
                if (file) {
                    if (old_file) {
                        console.log(old_file);
                        await store.deleteFile(old_file)
                    }
                    file.originalname = user_id + '-' + Date.now()
                    await store.storeFile(file)
                }
            } catch (error) {
                console.error(error);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }
            raw = {
                user_id: user_id,
                post_id: post_id,
                rating: rating,
                content: content ? content : '',
                image: file ? file.originalname : ''
            }
            ReviewModel.update(raw, (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).send({ mes: 'Có lỗi xảy ra!' })
                    return
                }

                if (result.affectedRows) {
                    //get new data
                    ReviewModel.getReviewOfUser(user_id, post_id, async (err, rows) => {
                        if (err) {
                            console.error(err);
                            res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                            return
                        }

                        const review = rows[0]
                        if (review.image) {
                            review.key_image = review.image
                            review.url = await store.getUrl(review.image)
                        } else {
                            review.key_image = null
                            review.url = null
                        }

                        delete review.image
                        res.send({ msg: 'Đánh giá của bạn đã được lưu!', rv: review })

                        AccommodationModel.updateRating(post_id, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                        })

                        return
                    })

                } else {
                    ReviewModel.create(raw, (err, result) => {
                        if (err) {
                            console.log(err);
                            res.status(500).send({ mes: 'Có lỗi xảy ra!' })
                            return
                        }
                        console.log(result);

                        ReviewModel.getReviewOfUser(user_id, post_id, async (err, rows) => {
                            if (err) {
                                console.error(err);
                                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                                return
                            }

                            const review = rows[0]
                            if (review.image) {
                                review.key_image = review.image
                                review.url = await store.getUrl(review.image)
                            } else {
                                review.key_image = null
                                review.url = null
                            }

                            delete review.image
                            res.send({ msg: 'Đánh giá của bạn đã được lưu!', rv: review })

                            AccommodationModel.updateRating(post_id, (err, result) => {
                                if (err) {
                                    console.log(err);
                                }
                            })
                            return
                        })
                    })
                }


            })


        })

    }
}

module.exports = ReviewController
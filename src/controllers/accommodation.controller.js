const store = require('../config/S3.js');
const AccommodationModel = require('../models/accommodation.model.js')
const { v6 } = require('uuid')

const { getCommune, getDistrict, getProvince } = require('../data/function.js');
const User = require('../models/user.model.js');
const File = require('../models/file.model.js');
const Favorite = require('../models/favorite.model.js');




const accomController = {
    /*
        this create new post
    */
    create: async (req, res) => {

        const { title, price, description, detailAddress, type, options, coord_lat, coord_lon, province, district, commune, contact } = req.body

        const files = req.files

        const user_id = req.user.user_id

        User.getLastPostTime(user_id, (err, data) => {

            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }


            const last = data[0].last_post

            const last_time = new Date(last)
            const now = new Date()
            const deltaSecond = (now - last_time) / 1000

            if (deltaSecond < 5 * 60) {
                res.status(400).send({ msg: 'Bạn có thể tạo thêm sau mỗi 5 phút!' })
                return
            }

            let rawData
            try {
                rawData = {
                    post_id: v6(),
                    user_id: user_id,
                    title: title,
                    price: price,
                    description: description,
                    detail_address: detailAddress,
                    type: type,
                    option: JSON.parse(options).join(','),
                    coord_lat: coord_lat,
                    coord_lon: coord_lon,
                    province: getProvince(province),
                    district: getDistrict(district),
                    commune: getCommune(commune),
                    contact: contact
                }
            } catch (error) {
                res.status(400).send({ msg: error.message })
                return
            }


            AccommodationModel.create(rawData, async (err, data) => {
                if (err) {
                    console.error(err);
                    res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }

                User.updateLastPostTime(user_id, (err, data) => {
                    if (err) {
                        console.error(err);
                    }
                })

                res.send({ msg: 'Successful! Quá trình này cần mất chút thời gian. \nChúng tôi sẽ thông báo cho bạn sau!' })

                for (let i = 0; i < files.length; i++) {
                    files[i].originalname = user_id + '-' + Date.now()
                    try {
                        console.log('Waiting store file ', files[i].originalname, '...');
                        await store.storeFile(files[i])
                        console.log('Success!')

                        File.create({
                            file_id: v6(),
                            post_id: rawData.post_id,
                            key: files[i].originalname,
                            type: ['image/jpg', 'image/jpeg', 'image/png'].includes(files[i].mimetype) ? 'image' : 'video',
                        }, (err, data) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    } catch (error) {
                        console.error('S3 Error: ', error);
                    }
                }

            })
        })

    },

    //this delete post
    delete: (req, res) => {
        const user_id = req.user.user_id
        const { id, cursor } = req.query //id is post_id

        if (!id || !cursor) {
            res.status(400).send({ msg: 'Bad Request!' })
            return
        }

        AccommodationModel.findByPostId(id, user_id, (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            if (!rows.length) {
                res.status(400).send({ msg: 'Bài viết không tồn tại!' })
                return
            }

            const post = rows[0]

            if (post.user_id != user_id) {
                res.status(403).send({ msg: 'bạn không có quyền!' })
                return
            }


            //Xóa file ảnh/ video liên quan bài viết
            File.findByPostId(id, async (err, rows) => {
                if (err) {
                    console.log(err);
                    res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }
                // xóa trên cloud
                try {
                    await Promise.all(rows.map(async row => {
                        await store.deleteFile(row.key_file)
                    }))
                } catch (error) {
                    console.log(error);

                }

                //Xóa
                AccommodationModel.delete(id, (err, result) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                        return
                    }

                    //Lấy dữ liệu thay thế
                    AccommodationModel.getOne(user_id, cursor, async (err, rows) => {
                        if (!rows.length) {
                            res.send({ msg: 'Đã xóa!', alt: null, cursor: cursor })
                            return
                        }

                        const post = rows[0]
                        console.log(post);

                        try {
                            const fileIdArr = post.file_id?.split(',')
                            const urlArr = post.key_file?.split(',')
                            const fileType = post.type_file?.split(',')

                            post.files = []

                            if (fileIdArr, urlArr, fileType) {
                                for (let i = 0; i < fileIdArr.length; i++) {

                                    post.files.push({
                                        file_id: fileIdArr[i],
                                        url: await store.getUrl(urlArr[i]),
                                        type: fileType[i]
                                    })


                                }
                            }
                            delete post.file_id
                            delete post.key_file
                            delete post.type_file
                            delete post.total

                            res.send({ msg: 'Đã xóa!', alt: post, cursor: post.modified_at })
                        } catch (error) {
                            console.log(error);
                            res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                        }


                    })

                })

            })

        })

    },

    //return list items of user by user_id
    getAll: (req, res) => {
        const user_id = req.user.user_id

        const { cursor } = req.query

        AccommodationModel.getAllByUserId(user_id, cursor, async (err, posts) => {

            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            try {

                const data = await Promise.all(posts.map(async post => {
                    const fileIdArr = post.file_id?.split(',')
                    const urlArr = post.key_file?.split(',')
                    const fileType = post.type_file?.split(',')

                    post.files = []

                    if (fileIdArr, urlArr, fileType) {
                        for (let i = 0; i < fileIdArr.length; i++) {

                            post.files.push({
                                file_id: fileIdArr[i],
                                url: await store.getUrl(urlArr[i]),
                                type: fileType[i]
                            })


                        }
                    }
                    delete post.file_id
                    delete post.key_file
                    delete post.type_file

                    return post
                }))


                res.send({ posts: data, cursor: data.length ? data[data.length - 1].modified_at : cursor })
            } catch (error) {
                console.log(error);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
            }


        })
    },


    //return post when user visit update page
    getUpdate: (req, res) => {
        const user_id = req.user.user_id
        const { post_id } = req.query


        AccommodationModel.findByPostId(post_id, user_id, async (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            if (!rows.length) {
                res.send({ data: null })
                return
            }

            const post = rows[0]

            if (post.user_id != user_id) {
                res.status(403).send({ msg: 'Bạn không có quyền chỉnh sửa bài này!' })
                return
            }

            try {
                const fileIdArr = post.file_id?.split(',')
                const urlArr = post.key_file?.split(',')
                const fileType = post.type_file?.split(',')

                post.files = []

                if (fileIdArr, urlArr, fileType) {
                    for (let i = 0; i < fileIdArr.length; i++) {

                        post.files.push({
                            file_id: fileIdArr[i],
                            url: await store.getUrl(urlArr[i]),
                            type: fileType[i]
                        })


                    }
                }
                delete post.file_id
                delete post.key_file
                delete post.type_file

                res.send({ data: post })
            } catch (error) {
                console.log(error);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
            }

        })

    },


    //Update post 
    postUpdate: (req, res) => {
        const user_id = req.user.user_id
        const { post_id } = req.params
        const files = req.files

        const { title, price, description, detailAddress, type, options, coord_lat, coord_lon, province, district, commune, contact, deleteFile } = req.body




        AccommodationModel.findByPostId(post_id, user_id, (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            if (!rows.length) {
                res.status(400).send({ msg: 'Bài viết không tồn tại!' })
                return
            }

            const post = rows[0]

            if (post.user_id != user_id) {
                res.status(403).send({ msg: 'Bạn không có quyền chỉnh sửa bài này!' })
                return
            }

            let rawData
            try {
                rawData = {
                    title: title,
                    price: price,
                    description: description,
                    detail_address: detailAddress,
                    type: type,
                    option: JSON.parse(options).join(','),
                    coord_lat: coord_lat,
                    coord_lon: coord_lon,
                    province: getProvince(province),
                    district: getDistrict(district),
                    commune: getCommune(commune),
                    contact: contact
                }
            } catch (error) {
                res.status(400).send({ msg: error.message })
                return
            }

            AccommodationModel.update(rawData, post_id, async (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }

                res.send({ msg: 'Đã lưu thay đổi!' })

                //store new File
                for (let i = 0; i < files.length; i++) {
                    files[i].originalname = user_id + '-' + Date.now()
                    try {
                        console.log('Waiting store file ', files[i].originalname, '...');
                        await store.storeFile(files[i])
                        console.log('Success!')

                        File.create({
                            file_id: v6(),
                            post_id: post_id,
                            key: files[i].originalname,
                            type: ['image/jpg', 'image/jpeg', 'image/png'].includes(files[i].mimetype) ? 'image' : 'video',
                        }, (err, data) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    } catch (error) {
                        console.error('S3 Error: ', error);
                    }
                }

                //deleteFile
                let deleleArr = JSON.parse(deleteFile)
                deleleArr.forEach((file) => {
                    File.deleteByFileId(file.key, async (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        try {
                            await store.deleteFile(file.key_file)
                        } catch (error) {
                            console.log(error);
                        }

                    })
                })



            })
        })
    },

    //Return post for detail page
    getById: (req, res) => {
        const { post_id } = req.query
        const user_id = req.user?.user_id
        console.log(post_id, user_id);

        AccommodationModel.findByPostId(post_id, user_id, async (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            if (!rows.length) {
                res.send({ data: null })
                return
            }

            const post = rows[0]

            try {
                const fileIdArr = post.file_id?.split(',')
                const urlArr = post.key_file?.split(',')
                const fileType = post.type_file?.split(',')

                post.files = []

                if (fileIdArr, urlArr, fileType) {
                    for (let i = 0; i < fileIdArr.length; i++) {

                        post.files.push({
                            file_id: fileIdArr[i],
                            url: await store.getUrl(urlArr[i]),
                            type: fileType[i]
                        })


                    }
                }

                delete post.file_id
                delete post.key_file
                delete post.type_file

                res.send({ data: post })
            } catch (error) {
                console.log(error);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
            }


        })
    },

    //return data for filter page
    filter: (req, res) => {
        const { province, district, commune, type, option, price } = req.query
        const user_id = req.user?.user_id
        let query
        const { cursor } = req.query


        try {
            query = {
                province: province ? getProvince(province) : null,
                district: district ? getDistrict(district) : null,
                commune: commune ? getCommune(commune) : null,
                price: isNaN(price) ? null : price,
                type: type ? JSON.parse(type).map(type => `'${type}'`).join(',') : null,
                option: option ? JSON.parse(option) : null
            }

        } catch (error) {
            res.status(400).send({ msg: 'Truy vấn không hợp lệ!' })
            return
        }

        AccommodationModel.filter(query, cursor, user_id, async (err, posts) => {
            if (err) {
                console.log(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            try {

                const data = await Promise.all(posts.map(async post => {
                    const fileIdArr = post.file_id?.split(',')
                    const urlArr = post.key_file?.split(',')
                    const fileType = post.type_file?.split(',')

                    post.files = []

                    if (fileIdArr, urlArr, fileType) {
                        for (let i = 0; i < fileIdArr.length; i++) {

                            post.files.push({
                                file_id: fileIdArr[i],
                                url: await store.getUrl(urlArr[i]),
                                type: fileType[i]
                            })


                        }
                    }
                    delete post.file_id
                    delete post.key_file
                    delete post.type_file

                    return post
                }))




                res.send({ posts: data, cursor: data.length ? data[data.length - 1].modified_at : cursor })
            } catch (error) {
                console.log(error);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
            }



        })
    },

    //user click store or delete from stoage
    favorite: (req, res) => {
        const { action } = req.params
        const user_id = req.user.user_id
        const { post_id } = req.query


        if (!['dislike', 'like'].includes(action)) {
            res.status(400).send({ msg: 'Bad request!' })
            return
        }
        if (!post_id) {
            res.status(400).send({ msg: 'Bad request!' })
            return
        }

        if (action === 'like') {
            Favorite.create(v6(), user_id, post_id, (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }

                res.send({ msg: 'Đã lưu!' })
                return
            })
        }
        if (action === 'dislike') {
            Favorite.delete(user_id, post_id, (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }

                res.send({ msg: 'Đã xóa!' })
                return
            })
        }

    },
    //return data user store with user_id
    getFav: (req, res) => {
        const user_id = req.user.user_id
        const { cursor } = req.query

        Favorite.findByUserId(user_id, cursor, async (err, rows) => {
            if (err) {
                console.log(err);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                return
            }

            try {

                const data = await Promise.all(rows.map(async post => {
                    const fileIdArr = post.file_id?.split(',')
                    const urlArr = post.key_file?.split(',')
                    const fileType = post.type_file?.split(',')

                    post.files = []
                    post.isFavorite = 1

                    if (fileIdArr, urlArr, fileType) {
                        for (let i = 0; i < fileIdArr.length; i++) {

                            post.files.push({
                                file_id: fileIdArr[i],
                                url: await store.getUrl(urlArr[i]),
                                type: fileType[i]
                            })


                        }
                    }
                    delete post.file_id
                    delete post.key_file
                    delete post.type_file

                    return post
                }))

                res.send({ posts: data, cursor: data.length ? data[data.length - 1].modified_at : cursor })
            } catch (error) {
                console.log(error);
                res.status(500).send({ msg: 'Có lỗi xảy ra!' })
            }


        })
    },
    //filter on map
    filterOnMap: (req, res) => {
        const { distance, type, lat, lon } = req.query
        console.log(distance, type, lat, lon);

        if (!distance || !type || !lat || !lon || isNaN(distance)) {
            res.status(400).send({ msg: 'Truy vấn không hợp lệ!' })
            return
        }
        let query
        try {
            query = {
                type: JSON.parse(type).length ? JSON.parse(type).map(type => `'${type}'`).join(',') : null,
                lat: lat * Math.PI / 180,
                lon: lon * Math.PI / 180,
                distance: distance
            }

            AccommodationModel.filterDistance(query, async (err, rows) => {
                if (err) {
                    console.log(err);
                    res.status(500).send({ msg: 'Có lỗi xảy ra!' })
                    return
                }
                console.log(rows);

                const data = await Promise.all(rows.map(async (row) => {
                    row.url = null;
                    if (row.key_file) {
                        row.url = await store.getUrl(row.key_file);
                    } return row;
                }));
                res.send({ data: data })

            })

        } catch (error) {
            console.log(error);
            res.status(400).send({ msg: 'Truy vấn không hợp lệ!' })
            return
        }



    }


}

module.exports = accomController
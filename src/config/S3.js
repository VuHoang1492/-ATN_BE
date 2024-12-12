require('dotenv').config()
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const sharp = require('sharp')

const bucket_name = process.env.S3_BUCKET_NAME
const region = process.env.S3_BUCKET_REGION
const access_key_id = process.env.S3_ACCESS_KEY
const secret = process.env.S3_SECRET

const s3 = new S3Client({
    region: region,
    credentials: {
        accessKeyId: access_key_id,
        secretAccessKey: secret
    }
})


const store = {
    storeFile: async (file) => {
        try {
            let param
            if (['image/jpg', 'image/jpeg', 'image/png'].includes(file.type)) {
                const f = await sharp(file.buffer).webp().toBuffer()
                param = {
                    Bucket: bucket_name,
                    Key: file.originalname,
                    Body: f,
                    ContentType: 'image/webp'
                }
            } else {
                param = {
                    Bucket: bucket_name,
                    Key: file.originalname,
                    Body: file.buffer,
                    ContentType: file.mimetype
                }
            }

            const command = new PutObjectCommand(param)
            await s3.send(command)

            console.log(file.originalname);
        } catch (error) {
            throw error
        }
    },




    getUrl: async (key) => {
        try {
            const param = {
                Bucket: bucket_name,
                Key: key,

            }
            const command = new GetObjectCommand(param)
            const url = await getSignedUrl(s3, command)
            return url
        } catch (error) {
            throw (error)
        }
    },

    deleteFile: async (key) => {
        try {
            const param = {
                Bucket: bucket_name,
                Key: key,
            }
            const command = new DeleteObjectCommand(param)
            await s3.send(command)
        } catch (error) {
            throw error
        }
    },


}

module.exports = store
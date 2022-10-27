const {uploadToCloudinary} = require('../service/uploadService')
const {bufferToDataURI}= require('../utils/file')
const uploadImage = async(req, res, next) => {
    try {

        const {file} = req
        if(!file){

            console.log('no file')
            return
        }
        const fileFormat = file.mimetype.split('/')[1]
        const {base64} = bufferToDataURI(fileFormat, file.buffer)
        const imageDetails  = await uploadToCloudinary(base64, fileFormat)
        res.json({
            status: 'success',
            message: 'uploaded successully',
            data:imageDetails
        })
    } catch (err) {
        next(console.log(err))
    }
}
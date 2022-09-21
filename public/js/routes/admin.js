const express = require('express')
const path = require('path')
const rootDir = require('../utils/path')
const adminRouter = express.Router()

const { body } = require('express-validator/check');

const { addProductPage, addProducts, adminProducts, editProductPage, saveEdittedProduct, deleteProduct } = require('../controllers/admin')



adminRouter
    .route('/add-product')
    .get(addProductPage)
    .post(
        [
            body('title').isString().isLength({ min: 3 }).trim(),

            body('price').isFloat(),
            body('description').isLength({ min: 5, max: 400 }).trim(),
        ],
        addProducts
    )

adminRouter.route('/products')
    .get(adminProducts)

adminRouter
    .route('/edit-product')
    .post(
        [
            body('title').isString().isLength({ min: 3 }).trim(),


            body('price').isFloat(),
            body('description').isLength({ min: 5, max: 400 }).trim(),
        ],
        saveEdittedProduct
    )
adminRouter.route('/delete-product').post(deleteProduct)
adminRouter.route('/edit-product/:productId')
    .get(editProductPage)


module.exports = { adminRouter }
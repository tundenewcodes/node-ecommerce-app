const path = require('path');

const express = require('express');
const { body } = require('express-validator/check');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const { upload } = require('../service/uploadService');

const router = express.Router();

// /admin/add-product => GET
router
    .route('/add-product')
    .get(isAuth, adminController.addProductPage)
    .post(

        [
            body('title').isString().isLength({ min: 3 }).trim(),
            body('price').isFloat(),
            body('description').isLength({ min: 5, max: 400 }).trim(),
        ],
        isAuth,
        adminController.addProducts
    )

// /admin/products => GET


router
    .route('/products')
    .get(isAuth, adminController.adminProducts)

// /admin/add-product => POST


router.route('/edit-product/:productId').get(isAuth, adminController.editProductPage);

router.route('/edit-product').post(
    [
        body('title')
        .isString()
        .isLength({ min: 3 })
        .trim(),
        body('price').isFloat(),
        body('description')
        .isLength({ min: 5, max: 400 })
        .trim()
    ],
    isAuth,
    adminController.saveEdittedProduct
);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
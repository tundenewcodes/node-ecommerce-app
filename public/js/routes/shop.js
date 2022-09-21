const express = require('express')
const path = require('path')
const { getProducts, index, getCart, getOrders, postCart, postOrder, getAProduct, deleteCartProduct, getInvoice } = require('../controllers/shop')
const rootDir = require('../utils/path')
const isAuth = require('../middleware/is-auth')
const shopRouter = express.Router()


shopRouter.route('/').get(index)
shopRouter.route('/products').get(getProducts)
shopRouter.route('/product/:productId').get(getAProduct)
shopRouter.route('/cart').get(isAuth, getCart).post(isAuth, postCart)
shopRouter.route('/cart-delete-item').post(isAuth, deleteCartProduct)

shopRouter.route('/orders').get(isAuth, getOrders)
shopRouter.route('/orders/:orderId').get(isAuth, getInvoice)
shopRouter.route('/create-order').post(isAuth, postOrder)



module.exports = shopRouter
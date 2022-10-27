const Product = require('../model/product')
const Order = require('../model/order')
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')
const ITEMS_PER_PAGE = 2
const index = (req, res) => {
    const page = +req.query.page || 1
    let totalItems

    Product.find()
      .countDocuments()
      .then((numProducts) => {
        totalItems = numProducts
        return Product.find()
          .skip((page - 1) * ITEMS_PER_PAGE)
          .limit(ITEMS_PER_PAGE)
      })
      .then((products) => {
        res.render('shop/index', {
          products: products,
          pageTitle: 'Shop',
          path: '/',
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        })
      })
      .catch((err) => {
        console.log(err)
      })
}

const getProducts = (req, res) => {
    const page = +req.query.page || 1
    let totalItems

    Product.find()
      .countDocuments()
      .then((numProducts) => {
        totalItems = numProducts
        return Product.find()
          .skip((page - 1) * ITEMS_PER_PAGE)
          .limit(ITEMS_PER_PAGE)
      })
      .then((products) => {
        res.render('shop/product-list', {
          products: products,
          pageTitle: 'Products',
          path: '/products',
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        })
      })
      .catch((err) => {
        console.log(err)
      })
}
const getAProduct = (req, res) => {
    const prodId = req.params.productId
    Product.findById(prodId)
        .then((product) => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/products',
                isAuthenticated: req.session.isLoggedIn
            })
        })
        .catch((err) => console.log(err))
}


const deleteCartProduct = (req, res, next) => {
    const prodId = req.body.productId
    req.user
        .removeFromCart(prodId)
        .then((result) => {
            res.redirect('/cart')
        })
        .catch((err) => console.log(err))
}

const getCart = (req, res, next) => {

    req.user
        .populate('cart.items.productId')
        .then((user) => {
            const products = user.cart.items
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products,
                isAuthenticated: req.session.isLoggedIn
            })
        })
        .catch((err) => console.log(err))
}

const postCart = (req, res, next) => {
    const prodId = req.body.productId
    Product.findById(prodId)
        .then((product) => {
            return req.user.addToCart(product)
        })
        .then((result) => {
            console.log('done')
            res.redirect('/cart')
        }).catch((err) => {
            console.log(err)
        })

}


const getOrders = (req, res) => {
    Order.find({ 'user.userId': req.user._id })
        .then((orders) => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders,
                isAuthenticated: req.session.isLoggedIn
            })
        })
        .catch((err) => console.log(err))
}

const postOrder = (req, res) => {
    req.user
        .populate('cart.items.productId')
        .then((user) => {
            const products = user.cart.items.map((i) => {
                return {
                    quantity: i.quantity,
                    product: {...i.productId._doc },
                }
            })
            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user,
                },
                products: products,
            })
            return order.save()
        })
        .then((result) => {
            return req.user.clearCart()
        })
        .then(() => {
            res.redirect('/orders')
        })
        .catch((err) => console.log(err))
}

const getInvoice = (req, res) =>{
const orderId = req.params.OrderId
Order.findById(orderId)
  .then((order) => {
    if (!order) {
      return next(new Error('No order found.'))
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error('Unauthorized'))
    }
    const invoiceName = 'invoice-' + orderId + '.pdf'
    const invoicePath = path.join('data', 'invoices', invoiceName)

    const pdfDoc = new PDFDocument()
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      'inline; filename="' + invoiceName + '"'
    )
    pdfDoc.pipe(fs.createWriteStream(invoicePath))
    pdfDoc.pipe(res)

    pdfDoc.fontSize(26).text('Invoice', {
      underline: true,
    })
    pdfDoc.text('-----------------------')
    let totalPrice = 0
    order.products.forEach((prod) => {
      totalPrice += prod.quantity * prod.product.price
      pdfDoc
        .fontSize(14)
        .text(
          prod.product.title +
            ' - ' +
            prod.quantity +
            ' x ' +
            '$' +
            prod.product.price
        )
    })
    pdfDoc.text('---')
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice)

    pdfDoc.end()
    // fs.readFile(invoicePath, (err, data) => {
    //   if (err) {
    //     return next(err);
    //   }
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader(
    //     'Content-Disposition',
    //     'inline; filename="' + invoiceName + '"'
    //   );
    //   res.send(data);
    // });
    // const file = fs.createReadStream(invoicePath);

    // file.pipe(res);
  })
  .catch((err) => next(err))

}

const getCheckout = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      let total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};



module.exports = {
    getProducts,
    index,
    getCart,
    postCart,
getInvoice,
    getOrders,
    getAProduct,
    deleteCartProduct,
    postOrder, getCheckout
}
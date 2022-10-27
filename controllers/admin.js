const Product = require('../model/product')
// const { uploadToCloudinary } = require('../service/uploadService')
// const { bufferToDataURI } = require('../utils/file')

const { deleteFile } = require('../utils/file');
const { validationResult } = require('express-validator/check')
const addProductPage = (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.render('/login')
    }
    res.render('admin/edit-product', {
        pageTitle: 'add product',
        path: 'admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
        isAuthenticated: req.session.isLoggedIn,
    })
}

const editProductPage = (req, res) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    // this query to edit product by a user
    Product.findById(prodId)
        // Product.findById(prodId)
        .then((product) => {
            if (!product) {
                return res.redirect('/')
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validationErrors: [],
                isAuthenticated: req.session.isLoggedIn
            })
        })
        .catch((err) => console.log(err))
}



const addProducts = async (req, res) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: 'Attached file is not an image.',
            validationErrors: []
        });
    }
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,

                price: price,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }
     const imageUrl = image.path
     const imagename = image.originalname
     const imagedest = image.destination
     const mypath = `/${imagedest}/${imagename}`
     console.log(image)
     console.log(imageUrl)
        const { file } = req
    if (!file) {

        console.log('no file')
        return
    }
    // const fileFormat = file.mimetype.split('/')[1]
    // const { base64 } = bufferToDataURI(fileFormat, file.buffer)
    // const imageDetails = await uploadToCloudinary(base64, fileFormat)
    // res.json({
    //     status: 'success',
    //     message: 'uploaded successully',
    //     data: imageDetails
    // })
    const product = new Product({

        title: title,
        price: price,
        description: description,
        imageUrl: req.file.path,
        userId: req.user
    });
    product
        .save()
        .then(result => {
            // console.log(result);
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        });
}

const adminProducts = (req, res) => {
    Product.find({ userId: req.user._id }) // simple authorization here
        .then((products) => {
            res.render('admin/product-list', {
                products,
                pageTitle: 'admin products',
                path: 'admin/admin-products',
                hasProducts: products.length > 0,
                activeShop: true,
                productCSS: true,
                isAuthenticated: req.session.isLoggedIn
            })
        }).catch((err) => {
            console.log(err)
        })

}

const saveEdittedProduct = (req, res) => {
    const prodId = req.body.productId
    const title = req.body.title
    const description = req.body.description
    const image = req.file
    const price = req.body.price
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                title: title,

                price: price,
                description: description,
                id: prodId

            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        })
    }



    Product.findById(prodId).then((product) => {
            if (product.userId.toString() != req.user._id.toString()) {
                return res.redirect('/')
            }
            product.title = title;
            product.description = description;
            if (image) {
                deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            product.price = price;
            return product.save()
                .then((result) => {
                    console.log('updated result..')
                    res.redirect('/admin/products')
                })
        })
        .catch((err) => {
            console.log(err)
        })




}

const deleteProduct = (req, res, next) => {
    const productId = req.body.productId
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found.'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        .then(() => {
            console.log('DESTROYED PRODUCT');
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}


module.exports = { deleteProduct, addProductPage, editProductPage, saveEdittedProduct, addProducts, adminProducts }
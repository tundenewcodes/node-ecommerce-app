const express = require('express')
const authRouter = express.Router()
const { check, body } = require('express-validator/check')
const User = require('../model/user')
const {
    getLogin,
    postLogin,
    postLogout,
    getSignUp,
    postSignUp,
    getReset,
    postReset,
    getNewPassword,
    postNewPassword
} = require('../controllers/auth')



authRouter.route('/login')
    .get(getLogin)
    .post([
        body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address.'),
        body('password', 'Password has to be valid.').trim()
        .isLength({ min: 5 })
        .isAlphanumeric()
    ], postLogin)

authRouter.route('/signup')
    .get(getSignUp)
    .post([
        check('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, { req }) => {
            // if (value === 'test@test.com') {
            //   throw new Error('This email address if forbidden.');
            // }
            // return true;
            return User.findOne({ email: value }).then(userDoc => {
                if (userDoc) {
                    return Promise.reject(
                        'E-Mail exists already, please pick a different one.'
                    );
                }
            });
        }),
        body(
            'password',
            'Please enter a password with only numbers and text and at least 5 characters.'
        )
        .isLength({ min: 5 }).trim()
        .isAlphanumeric(),
        body('confirmPassword').trim().custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match!');
            }
            return true;
        })
    ], postSignUp)
authRouter.route('/reset')
    .get(getReset)
    .post(postReset)
authRouter.route('/reset/:token')
    .get(getNewPassword)


authRouter.route('/new-password')
    .post(postNewPassword)



authRouter.route('/logout')
    .post(postLogout)


module.exports = authRouter
const User = require('../model/user')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { validationResult } = require('express-validator/check')
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        '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',
    },
  })
)

const getLogin = (req, res, next) => {
  // const isLoggedIn =req.get('Cookie')
  // .split('=')[1]
  let message = req.flash('error')
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
    },
    validationErrors: [],
  })
}

const postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  //    res.cookie('isLoggedIn', 'true', {
  //      maxAge: 900000,
  //      httpOnly: true,
  //    })

 const errors = validationResult(req)
 if (!errors.isEmpty()) {
   return res.status(422).render('auth/login', {
     path: '/login',
     pageTitle: 'Login',
     errorMessage: errors.array()[0].msg,
     oldInput: {
       email: email,
       password: password,
     },
     validationErrors: errors.array(),
   })
 }


  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }

      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true
            req.session.user = user
            return req.session.save((err) => {
              console.log(err)
              res.redirect('/')
            })
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [],
          })
        })
        .catch((err) => {
          console.log(err)
          res.redirect('/login')
        })
    })
    .catch((err) => {
      console.log(err)

    })
}
const postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err)
    res.redirect('/')
  })
}

const postSignUp = (req, res) => {
  const name = req.body.name
  const email = req.body.email
  const password = req.body.password
  const confirmPassword = req.body.confirmPassword


  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors.array())
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,  name:name,
        confirmPassword: req.body.confirmPassword,
      },
      validationErrors: errors.array(),
    })
  }

  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash(
          'error',
          'E-Mail exists already, please use a different email or signin.'
        )
        return res.redirect('/signup')
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email: email,
            password: hashedPassword,
            name: name,
            cart: { items: [] },
          })
          return user.save()
        })
        .then((result) => {
          res.redirect('/login')
        })
    })
    .catch((err) => {
      console.log(err)
    })
}

const getSignUp = (req, res) => {
  let message = req.flash('error')
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      name :'',
      confirmPassword: '',
    },
    validationErrors: [],
  })
}

const getReset = (req, res, next) => {
  let message = req.flash('error')
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message,
  })
}

const postReset = (req, res) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect('/reset')
    }
    const token = buffer.toString('hex')

    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('error', 'no account with the email provided')
          return res.redirect('/reset')
        }
        user.resetToken = token
        user.resetTokenExpiration = Date.now() + 3600000
        return user.save()
      })
      .then((result) => {
        res.redirect('/')
        transporter.sendMail({
          to: req.body.email,
          from: 'fadipe11@gmail.com',
          subject: 'Password reset',
          html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
          `,
        })
      })
      .catch((err) => {
        console.log(err)
      })
  })
}

const getNewPassword = (req, res) => {
  const token = req.params.token
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      let message = req.flash('error')
      if (message.length > 0) {
        message = message[0]
      } else {
        message = null
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'Change Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      })
    })
    .catch((err) => {
      console.log(err)
    })
}

const postNewPassword = (req, res) => {
  const newPassword = req.body.password
  const userId = req.body.userId
  const passwordToken = req.body.passwordToken
  let resetUser

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user
      return bcrypt.hash(newPassword, 12)
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword
      resetUser.resetToken = undefined
      resetUser.resetTokenExpiration = undefined
      return resetUser.save()
    })
    .then((result) => {
      res.redirect('/login')
    })
    .catch((err) => {
      console.log(err)
    })
}

module.exports = {
  getLogin,
  postLogin,
  postLogout,
  postSignUp,
  getSignUp,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword,
}

const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const error = require('./controllers/error')
const PORT = process.env.PORT || 3500
const connectDB = require('./utils/database')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
require('dotenv').config()
const isAuth = require('./middleware/is-auth')
const csrf = require('csurf');
const flash = require('connect-flash')
const multer = require('multer')


const User = require('./model/user')

const { adminRouter } = require('./routes/admin')
const shopRouter = require('./routes/shop')
const authRouter = require('./routes/auth')



app.set('view engine', 'ejs')
app.set('views', 'views')
app.use(express.urlencoded({ extended: false }));
// built-in middleware for json
app.use(express.json());


const store = new MongoDBStore({
    uri: process.env.MONDODB_URL,
    collection: 'sessions',
})
const csrfProtection = csrf()


const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir('./uploads/',(err)=>{
 cb(null, './uploads/')
    })

  },
  filename: (req, file, cb) => {
   cb(null, new Date().toISOString() + '-' + file.originalname)
  },
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}


//serve static files
app.use(
  multer({ storage: fileStorage, fileFilter:fileFilter }).single(
    'image'
  )
)
// app.use(
//   multer({dest:'images'}).single(
//     'image'
//   )
//)
app.use(express.static(path.join(__dirname, '/public')));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store,
    })
)

app.use(csrfProtection)
app.use(flash())
app.use((req, res, next) => {
    if (!req.session.user) {
        return next()
    }
    User.findById(req.session.user._id)
        .then((user) => {
if(!user){
    return next()
}
            req.user = user
            next()
        })
        .catch((err) => console.log(err))
})


app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});


app.use('/admin', isAuth, adminRouter)
app.use(shopRouter)
app.use(authRouter)

// app.use(error)



const start = async() => {
    try {
        await connectDB(process.env.MONDODB_URL)


        app.listen(
            PORT,
            console.log(`server is running on PORT : ${PORT}`)
        )


    } catch (err) {
        console.log(err)
    }
}
start()
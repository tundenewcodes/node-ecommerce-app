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
    //const cloudinary = require('cloudinary')

const User = require('./model/user')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const adminRouter = require('./routes/admin')
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
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(
            null,
            new Date().toISOString().replace(/:/g, '-') +
            '-' +
            file.originalname
        )
    }

    // destination: (req, file, cb) => {
    //     fs.mkdir('./uploads/', (err) => {
    //         cb(null, path.join(__dirname, './uploads/'))
    //     })

    // },
    // filename: (req, file, cb) => {
    //         cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname)
    //     }
    // destination: (req, file, cb) => {
    //     cb(null, 'uploads');
    // },
    // filename: (req, file, cb) => {
    //     cb(null, new Date().toISOString() + '-' + file.originalname);
    // }
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


app.use(express.static(path.join(__dirname, 'public')));
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single(
        'image'
    )
)

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store,
    })
)


app.use(flash())

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn
    next()
})


app.use((req, res, next) => {
    if (!req.session.user) {
        return next()
    }
    User.findById(req.session.user._id)
        .then((user) => {
            if (!user) {
                return next()
            }
            req.user = user
            next()
        })
        .catch((err) => {
            next(new Error(err))
        })
})

app.use(csrfProtection)
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'accessLog'), { flags: 'a' })
app.use(helmet())
app.use(compression())
app.use(morgan('combined', { stream:accessLogStream }))
app.use('/admin', isAuth, adminRouter)
app.use(shopRouter)
app.use(authRouter)

app.use(error)



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
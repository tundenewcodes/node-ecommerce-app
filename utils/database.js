// const Sequelize = require('sequelize')


// const sequelize = new Sequelize('node-complete', 'root', 'Tunde2022.', {
//     dialect: 'mysql',
//     host :'localhost'
// })

// module.exports = sequelize


const  mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient



// const mongoConnect = ()=>{
//     MongoClient.connect(
//       'mongodb+srv://tunde:tunde2022@cluster0.sypr6h8.mongodb.net/?retryWrites=true&w=majority'
//     ).then(()=>{
//         console.log('connected to mongo db')

//     })
//     .catch((err)=>{console.log(err)})
// }

const mongoose = require('mongoose')

const connectDB = (url) => {
  mongoose
    .connect(url)
    .then(() => {
      console.log('connected to the database now ....')
    })
    .catch((err) => {
      console.log(err)
    })
}

module.exports = connectDB
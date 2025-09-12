const express =  require("express")
const cors = require('cors')
const bodyParser = require("body-parser")
const listingRoutes = require('./src/route/listingRoutes')
const authRoutes = require('./src/route/authRoutes')
const orderRoutes = require("./src/route/orderRoutes")
const paymentRoutes = require('./src/route/paymentRoutes')

const app = express()

app.use(cors())
app.use(bodyParser.json())

app.use('/',listingRoutes)
app.use('/',authRoutes)
app.use('/',paymentRoutes)
app.use("/",orderRoutes)

module.exports = app;
require('./Data_base/mongoose-data-base')
const express = require('express')
const app = express()
const userRouter = require('./routers/user')
const productRouter = require('./routers/product')
const orderRouter = require('./routers/order')
const delivaryRouter = require('./routers/delivaryUser')
const normalRouter = require('./routers/normalUser')
const premiumRouter = require('./routers/premiumUser')
const adminRouter = require('./routers/adminUser')
const ordersRouter = require('./routers/orders')
const port = process.env.PORT || 3000


app.use('/products_images', express.static('./products_images'))
app.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}))
app.use(express.json({limit: '50mb'}));
app.use(userRouter)
app.use(productRouter)
app.use(orderRouter)
app.use(delivaryRouter)
app.use(normalRouter)
app.use(premiumRouter)
app.use(adminRouter)
app.use(ordersRouter)

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})

const express = require('express')
const Product = require('../modules/product')
const auth = require('../middleware/auth')
const Orders = require('../modules/orders')
const Role = require("../middleware/Roles")
const Order = require('../modules/order')
const router = new express.Router()
const randomstring = require("randomstring")
const Cobone = require('../modules/cobon')


// Create Orders 
router.post('/orders', auth, async (req, res) => {
    try {
        const orders = new Orders({ buyer: req.user.id, total: req.body.total, address: req.body.address })
        for (let order of req.body.orderItems) {
            order.orderer = req.user.id
            order.date = new Date()
            const orderItem = new Order(order)
            orders.orders.push(orderItem.id)
            const product = await Product.findOne({ _id: order.product_id })
            orderItem.premium_id = product.owner
            await orderItem.save()
            await product.colorsAndQuantityAndSizes.find((colorsAndQuantityAndSizes) => {
                return colorsAndQuantityAndSizes.color === order.color

            }).sizesAndQuantity.find((sizeQuantity) => {
                if (sizeQuantity.size === order.size) {
                    sizeQuantity.quantity -= order.quantity
                }
            })
            product.selling_counter += order.quantity
            await product.save()
        }
        orders.date = new Date()
        await orders.save()
        res.status(201).send(orders)
    } catch (e) {
        res.status(400).send(e)
    }
})


// Get Orders by id
router.get('/orders/:id', auth, async (req, res) => {

    try {
        const orders = await Orders.findOne({ _id: req.params.id })
        if (!orders) {
            return res.status(404).send()
        }
        orders.orders = await orders.convertToOrder()
        res.send(orders)
    } catch (e) {
        res.status(500).send()
    }
})

// Get orders By Status
router.post('/getOrdersByStatus', auth, async (req, res) => {
    try {
        const orders = await Orders.find({
            isConfirmed: req.body.isConfirmed,
            isDelivered: req.body.isDelivered,
            beingDelivered: req.body.beingDelivered
        })
        if (!orders) {
            res.status(404).send({ error: 'Orders Not Found' })
        }
        for (let order of orders) {
            order.orders = await order.convertToOrder()
        }
        res.send(orders)
    } catch (e) {
        res.status(400).send()
    }
})

// Get Orders by buyer id
router.get('/ordersByBuyer/:id', auth, async (req, res) => {

    try {
        const orders = await Orders.find({ buyer: req.params.id })
        if (!orders) {
            return res.status(404).send()
        }
        for (let order of orders) {
            order.orders = await order.convertToOrder()
        }
        res.send(orders)
    } catch (e) {
        res.status(400).send()
    }
})

// Update Orders by id from user side
router.patch('/orders/:id', async (req, res, next) => {
    auth(req, res, next, [Role.User, Role.Admin, Role.Seller])
},
    async (req, res) => {
        const updates = Object.keys(req.body)
        const allowedUpdates = ['orders', 'address', 'notes']
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

        if (!isValidOperation) {
            return res.status(400).send({ error: 'Invalid updates!' })
        }

        try {
            const orders = await Orders.findOne({ _id: req.params.id, owner: req.user._id })

            if (!orders) {
                return res.status(404).send()
            }

            updates.forEach((update) => orders[update] = req.body[update])
            await orders.save()
            res.send(product)
        } catch (e) {
            res.status(400).send(e)
        }
    })

// Update Orders by id from delivary side 
router.patch('/update-orders-status/:id', async (req, res, next) => {
    auth(req, res, next, [Role.Delevery, Role.Admin])
},
    async (req, res) => {
        const updates = Object.keys(req.body)
        const allowedUpdates = ['beingDelivered', 'isDelivered', 'isConfirmed']
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

        if (!isValidOperation) {
            return res.status(400).send({ error: 'Invalid updates!' })
        }

        try {
            const orders = await Orders.findOne({ _id: req.params.id })

            if (!orders) {
                return res.status(404).send()
            }

            updates.forEach((update) => orders[update] = req.body[update])
            await orders.save()
            res.send(orders)
        } catch (e) {
            res.status(400).send(e)
        }
    })

// Delete Orders by id 
router.delete('/orders/:id', auth, async (req, res) => {
    try {
        const orders = await Orders.findOneAndDelete({ _id: req.params.id })

        if (!orders) {
            res.status(404).send()
        }
        for (let order of orders.orders) {
            const deletedOrder = await Order.findOneAndDelete({ id: order })
        }

        res.send(orders)
    } catch (e) {
        res.status(400).send()
    }
})

// get total earnings this month
router.get('/monthearnings/:id', auth, async (req, res) => {
    let earnings = 0
    try {
        const startdate = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0);
        const orderproduct = await Order
            .find({ premium_id: req.params.id, date: { "$gte": new Date(startdate), "$lte": new Date() } })
        for (let orderloop of orderproduct) {
            const product = await Product.findOne({ _id: orderloop.product_id })
            earnings += product.price * orderloop.quantity
        }
        const month_earnings = {
            earnings: earnings
        }

        res.status(200).send(month_earnings)
    }
    catch (e) {
        res.status(400).send()
    }
})

// get total earnings last month
router.get('/lastearnings/:id', auth, async (req, res) => {
    let earnings = 0
    try {
        const startdate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1, 0, 0, 0);
        const enddate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 31, 0, 0, 0);
        const orderproduct = await Order
            .find({ premium_id: req.params.id, date: { "$gte": new Date(startdate), "$lte": new Date(enddate) } })
        for (let orderloop of orderproduct) {
            const product = await Product.findOne({ _id: orderloop.product_id })
            earnings += product.price * orderloop.quantity
        }
        let lastearnings = {
            earnings: earnings
        }
        res.status(200).send(lastearnings)
    }
    catch (e) {
        res.status(400).send()
    }
})

// get total earnings this year
router.get('/yearearnings/:id', auth, async (req, res) => {
    let earnings = 0
    try {
        const startdate = new Date(new Date().getFullYear(), 1, 1, 0, 0, 0)
        const enddate = new Date(new Date().getFullYear(), 12, 31, 23, 59, 59)
        const orderproduct = await Order
            .find({ premium_id: req.params.id, date: { "$gte": new Date(startdate), "$lte": new Date(enddate) } })
        for (let orderloop of orderproduct) {
            const product = await Product.findOne({ _id: orderloop.product_id })
            earnings += product.price * orderloop.quantity
        }
        let yearearnings = {
            earnings: earnings
        }
        res.status(200).send(yearearnings)
    }
    catch (e) {
        res.status(400).send()
    }
})

// get total sold items this month
router.get('/monthsolditems/:id', auth, async (req, res) => {
    let solditems = 0
    try {
        const startdate = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0);
        const orderproduct = await Order
            .find({ premium_id: req.params.id, date: { "$gte": new Date(startdate), "$lte": new Date() } })

        for (let orderloop of orderproduct) {
            const product = await Product.findOne(orderloop.product_id)
            solditems += product.selling_counter
        }

        let monthsolditems = {
            solditems: solditems
        }
        res.status(200).send(monthsolditems)
    }
    catch (e) {
        res.status(400).send()
    }
})

// get total sold items last month
router.get('/lastsolditems/:id', auth, async (req, res) => {
    let solditems = 0
    try {
        const startdate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1, 0, 0, 0);
        const enddate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 31, 0, 0, 0);
        const orderproduct = await Order
            .find({ premium_id: req.params.id, date: { "$gte": new Date(startdate), "$lte": new Date(enddate) } })
        for (let orderloop of orderproduct) {
            const product = await Product.findOne(orderloop.product_id)
            solditems += product.selling_counter
        }
        let lastsolditems = {
            solditems: solditems
        }
        res.status(200).send(lastsolditems)
    }
    catch (e) {
        res.status(400).send()
    }
})

// get total sold items this year
router.get('/yearsolditems/:id', auth, async (req, res) => {
    let solditems = 0
    try {
        const startdate = new Date(new Date().getFullYear(), 1, 1, 0, 0, 0);
        const enddate = new Date(new Date().getFullYear(), 12, 31, 23, 59, 59);
        const orderproduct = await Order
            .find({ premium_id: req.params.id, date: { "$gte": new Date(startdate), "$lte": new Date(enddate) } })
        for (let orderloop of orderproduct) {
            const product = await Product.findOne(orderloop.product_id)
            solditems += product.selling_counter
        }
        let yearsolditems = {
            solditems: solditems
        }
        res.status(200).send(yearsolditems)
    }
    catch (e) {
        res.status(400).send()
    }
})

// send delivery price
router.get('/deliveryprice', auth, async (req, res) => {
    try {
        const deliveryprice = {
            solditems: 2000
        }
        res.status(200).send(deliveryprice)
    }
    catch (e) {
        res.status(400).send()
    }
})

// Make a cobone
router.post('/cobone', async (req, res, next) => {
    auth(req, res, next, [Role.Admin])
},
    async (req, res) => {
        try {
            const code = randomstring.generate(5)
            const cobone = new Cobone({
                code: code,
                discount: req.body.discount,
                expiringdate: req.body.expiringdate
            })

            res.status(200).send(cobone)
        }
        catch (e) {
            res.status(400).send(e)
        }
    })

// check the cobone and return the dicount 
router.post('/checkcobon', auth, async (req, res) => {
    try {
        const cobone = await Cobone.findOne({ code: req.body.code })
        if (!cobone || cobone.expiringdate < new Date()) {
            res.send({ discount: 0 })
        }
        res.send({ discount: cobone.discount })
    }
    catch (e) {
        res.status(400).send(e)
    }
})

module.exports = router
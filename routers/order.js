const express = require('express')
const Order = require('../modules/order')
const auth = require('../middleware/auth')
const router = new express.Router()
const Role = require('../middleware/Roles')
const PremiumUser = require('../modules/premiumUser')
const Product = require('../modules/product')
const Orders = require('../modules/orders')


// Create Order
router.post('/order', async (req, res, next) => {
    auth(req, res, next, [Role.Seller, Role.normal])
},
    async (req, res) => {
        const order = new Order({
            ...req.body,
            orderer: req.user._id
        })
        const product = await Product.findOne({ _id: req.body.product_id })
        const premiumUser = await PremiumUser.findOne({ _id: product.owner })
        order.premium_id = premiumUser._id
        try {
            await order.save()
            res.status(201).send(order)
        } catch (e) {
            res.status(400).send(e)
        }
    })

// Get Order by orderer
router.get('/order', auth, async (req, res) => {
    try {
        const order = await Order.find({ orderer: req.user._id })
        res.send(order)
    } catch (e) {
        res.status(500).send()
    }
})

// Get Order by id
router.get('/order/:id', auth, async (req, res) => {

    try {
        const order = await Order.findOne({ _id: req.params.id })
        if (!order) {
            return res.status(404).send()
        }

        res.send(order)
    } catch (e) {
        res.status(500).send()
    }
})

// Get Order by seller 
router.get('/orderBySeller/:id', async (req, res, next) => {
    auth(req, res, next, [Role.Seller, Role.admin])
},
    async (req, res, next) => {
        try {
            let data = []
            const allOrder = await Order.find({ premium_id: req.params.id })
            for (let order of allOrder) {
                const orders = await Orders.findOne({ orders: order.id })
                const orderWithStatus = {
                    order: order,
                    beingDelivered: orders.beingDelivered,
                    isDelivered: orders.isDelivered,
                    isConfirmed: orders.isConfirmed
                }
                data.push(orderWithStatus)
            }
            res.send(data)
        } catch (e) {
            res.status(400).send(e)
        }
    })

// Update Order by id
router.patch('/order/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['quantity', 'notes']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }
    try {

        const order = await Order.findOne({ _id: req.params.id })
        if (!order) {
            return res.status(404).send()
        }

        updates.forEach((update) => order[update] = req.body[update])
        await order.save()
        res.send(order)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Delete order by id
router.delete('/order/:id', auth, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id })
        if (!order) {
            res.status(404).send()
        }
        const orders = await Orders.findOne({ orders: order.id })
        const deletedOrder = orders.orders.indexOf(order.id)
        const product = await Product.findById(order.product_id)
        orders.total -= product.price - (product.price * orders.discount / 100)
        product.selling_counter -= order.quantity
        if (deletedOrder > -1) {
            orders.orders.splice(deletedOrder, 1)
        }
        await order.remove()
        await product.save()
        if (!orders.orders.length) {
            await orders.remove()
        } else {
            await orders.save()
        }
        res.send(order)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router
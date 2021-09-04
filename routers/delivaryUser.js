const express = require('express')
const User = require('../modules/user')
const DelivaryUser = require('../modules/delivaryUser')
const auth = require('../middleware/auth')
const router = new express.Router()
const Role = require('../middleware/Roles')
const Orders = require('../modules/orders')


// DelivaryUser singning up
router.post('/delivaryUser', async (req, res) => {
    const user = new User(req.body)
    user.role = 'delivary'
    const delivaryUser = new DelivaryUser({ user: user.id })
    try {
        const token = await user.generateAuthToken()
        await user.save()
        await delivaryUser.save()
        res.header('Authorization', token).status(201).send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})


// delivaryUser logging in
router.post('/delivaryUser/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        if (!user) {
            res.status(404).send({ error: 'User Not Found' })
        }
        const delivaryUser = await DelivaryUser.findOne({ user: user })
        if (!delivaryUser) {
            res.status(404).send({ error: 'This Is Not Delivary User Account' })
        }
        const token = await user.generateAuthToken()
        res.header('Authorization', token).send(user)
    } catch (e) {
        res.status(400).send(e.toString())
    }
})

// delivaryUser logging out 
router.post('/delivaryUser/logout', auth, async (req, res, next) => {
    auth(req, res, next, [Role.Delevery])
},
    async (req, res) => {
        try {
            res.send('You are logged out successfuly')
        } catch (e) {
            res.status(500).send()
        }
    })

// Delete Delivery User
router.delete('/deleteDelivery/:id', auth, async (req, res, next) => {
    auth(req, res, next, [Role.Admin])
},
    async (req, res) => {
        try {
            await User.findOneAndDelete({ _id: req.params.id })
            await DelivaryUser.findOneAndDelete({ user: req.params.id })
            if (!delivaryUser) {
                res.status(404).send
            }
            const letter = {
                string: 'Successfully Deleted'
            }
            res.send(letter)
        } catch (e) {
            res.status(400).send(e)
        }
    })

// Get all delivary accounts
router.get('/getAllDelivaries', auth, async (req, res, next) => {
    auth(req, res, next, [Role.Admin])
},
    async (req, res) => {
        try {
            const delivaryUsers = await DelivaryUser.find()
            if (!delivaryUsers) {
                res.status(404).send
            }
            let users = []
            for (let delivary of delivaryUsers) {
                const user = await User.findById(delivary.user)
                users.push(user)
            }
            res.send(users)
        } catch (e) {
            res.status(400).send(e)
        }
    })

// Take An Order 
router.post('/takeOrder/:id', auth, async (req, res, next) => {
    auth(req, res, next, [Role.Delevery])
},
    async (req, res) => {
        try {
            const delivaryUser = await DelivaryUser.findOne({ user: req.user.id })
            if (!delivaryUser) {
                res.status(404).send({ error: 'User Not Found' })
            }
            const orders = await Orders.findById(req.params.id)
            if (!orders || !orders.isConfirmed) {
                res.status(404).send({ error: 'Order Is Unavailable' })
            }
            orders.delivary_id = req.user.id
            orders.beingDelivered = true
            delivaryUser.orders.push(orders)
            await delivaryUser.save()
            await orders.save()
            res.send({ messege: 'Successfully Taked' })
        } catch (e) {
            res.status(400).send(e)
        }
    })


// Get orders By Status for Delivary user
router.post('/getOrdersByStatus/:id', auth, async (req, res) => {
    try {
        const orders = await Orders.find({
            delivary_id: req.params.id,
            isDelivered: req.body.isDelivered
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


module.exports = router
const express = require('express')
const router = new express.Router()
const User = require('../modules/user')
const NormalUser = require('../modules/normalUser')
const auth = require('../middleware/auth')
const nodemailer = require('nodemailer');
var randomstring = require("randomstring")
const Role = require('../middleware/Roles')
const Product = require('../modules/product')

let code;
// User singning up
router.post('/users', async (req, res) => {
    try {
        const user = new User(req.body)
        const normalUser = new NormalUser({ user: user.id, wishlist: req.body.wishlist, orders: req.body.orders })
        await user.save()
        await user.delete()
        await normalUser.save()
        await normalUser.delete()
        res.status(200).send(JSON.parse('{"Status":"Done"}'))

    } catch (e) {
        res.status(400).send(e)
    }

})

//Generate code 
router.post('/Generate', async (req, res) => {
    try {
        if (req.body.email) {
            var random = randomstring.generate(7)
            code = random
            let transportar = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth:
                {
                    user: "mazen.sh1221@gmail.com",
                    pass: "Messimazen10"
                }
            });
            const msg = {
                from: 'mezoshp23@gmail.com',
                to: req.body.email,
                subject: "Your Sallaty code",
                html: '<p>Hi ' + ',<p>You can enter this code to log into Sallaty:</p>' + "\n" + code
            }
            transportar.sendMail(msg, function (err, info) {
                if (err)
                    throw err;
            })
            var codejson = { "Code": code };
            res.status(200).send(JSON.parse(JSON.stringify(codejson)))
        }
        else
            res.send("you don't send an email")
    }
    catch (e) {
        res.status(400).send(e)
    }

})

//confirmation
router.post('/confirmation', async (req, res) => {
    try {
        if (req.body.code && req.body.name && req.body.email && req.body.number && req.body.password) {
            if (code == req.body.code) {
                const user = new User(req.body)
                const normalUser = new NormalUser({ user: user.id, wishlist: req.body.wishlist, orders: req.body.orders })
                user.role = 'normal'
                const token = await user.generateAuthToken()
                await user.save()
                await normalUser.save()
                res.header('Authorization', token).status(201).send(user).send("The code is true and the user created")
            }

            else
                res.status(400).send("False code")
        }
        else
            res.send("There's error in user information")
    } catch (e) {
        res.status(400).send(e)
    }
})


//add to wishlist
router.post('/addToWishlist', async (req, res, next) => {
    auth(req, res, next, [Role.Seller, Role.Normal])
},
    async (req, res) => {
        try {
            const normalUser = await NormalUser.findOne({ user: req.user.id })

            if (!normalUser) {
                return res.status(404).send()
            }

            normalUser.wishlist.push(req.query.product)
            normalUser.save()
            res.send(normalUser)
        } catch (e) {
            res.status(400).send(e)
        }

    })

// get wishlist 
router.get('/getWishlist', auth, async (req, res) => {
    try {
        const normalUser = await NormalUser.findOne({ user: req.user.id })
        if (!normalUser) {
            return res.status(404).send()
        }

        const wishlist = normalUser.wishlist
        let wishlistProducts = []
        for (let p_id of wishlist) {
            const product = await Product.findOne({ _id: p_id._id })
            wishlistProducts.push(product)
        }

        res.send(wishlistProducts)
    }
    catch (e) {
        res.status(400).send(e)
    }
})

// get wishlist by user id 
router.get('/getWishlist/:id', auth, async (req, res) => {
    try {
        const normalUser = await NormalUser.findOne({ user: req.params.id })

        if (!normalUser) {
            return res.status(404).send()
        }

        const wishlist = normalUser.wishlist
        let wishlistProducts = []
        for (let p_id of wishlist) {
            const product = await Product.findOne({ _id: p_id._id })
            wishlistProducts.push(product)
        }

        res.send(wishlistProducts)
    }
    catch (e) {
        res.status(400).send(e)
    }
})

// delet from wishlist
router.delete('/deletFromWishlist', async (req, res, next) => {
    auth(req, res, next, [Role.Seller, Role.Normal])
},
    async (req, res) => {
        try {
            const normalUser = await NormalUser.findOne({ user: req.user.id })

            if (!normalUser) {
                return res.status(404).send()
            }
            let deletedProduct = normalUser.wishlist.indexOf(req.query.product)
            if (deletedProduct > -1) {
                normalUser.wishlist.splice(deletedProduct, 1)
            } else {

                throw new Error
            }

            normalUser.save()
            res.send(normalUser)
        } catch (e) {
            res.status(400).send(e)
        }

    })

// Update orders
router.patch('/updateOrders/:id', async (req, res, next) => {
    auth(req, res, next, [Role.Admin, Role.Normal])
},
    async (req, res) => {
        try {
            const normalUser = await NormalUser.findOne({ _id: req.params.id })

            if (!normalUser) {
                return res.status(404).send()
            }
            normalUser.orders = req.body.orders
            normalUser.save()
            res.send(normalUser)
        } catch (e) {
            res.status(400).send(e)
        }

    })



module.exports = router
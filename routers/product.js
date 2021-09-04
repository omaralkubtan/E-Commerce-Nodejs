const express = require('express')
const Product = require('../modules/product')
const auth = require('../middleware/auth')
const router = new express.Router()
const Role = require('../middleware/Roles')
const User = require('../modules/user')
const fs = require('fs')
var FuzzySearch = require('fuzzy-search')


// Create new product 
router.post('/product', auth, async (req, res, next) => {
    auth(req, res, next, [Role.Seller])
},
    async (req, res) => {
        try {
            const product = new Product({
                ...req.body,
                owner: req.user._id
            })
            product.date = new Date()
            var indexCounter = 0
            product.images.forEach((image) => {
                const url = ' https://sallaty-store.herokuapp.com/'
                const path = 'products_images/' + product._id + '_' + indexCounter + '.png'
                fs.writeFileSync(path, image, { encoding: "base64" })
                product.images[indexCounter] = url + path
                indexCounter++
            })
            await product.save()
            res.status(201).send(product)
        } catch (e) {
            res.status(400).send(e)
        }
    })

// Get product by category
router.get('/product', auth, async (req, res) => {
    try {
        const products = await Product.find({ category: req.query.category })

        const filteredProducts = products.filter((product) => {
            return !product.isDeleted
        })
        let allData = []
        for (let product of filteredProducts) {
            const data = {
                product: product,
                isAdded: await product.checkWishlist(req.user)
            }
            allData.push(data)
        }
        res.send(allData)
    } catch (e) {
        res.status(500).send()
    }
})

// Get product by type
router.get('/getProductByType', auth, async (req, res) => {

    try {
        const products = await Product.find({ type: req.query.type })

        const filteredProducts = products.filter((product) => {
            return !product.isDeleted
        })
        let allData = []
        for (let product of filteredProducts) {
            const data = {
                product: product,
                isAdded: await product.checkWishlist(req.user)
            }
            allData.push(data)
        }
        res.send(allData)
    } catch (e) {
        res.status(500).send()
    }
})

// Get product by id
router.get('/product/:id', auth, async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id })
        if (!product || product.isDeleted) {
            return res.status(404).send()
        }
        const data = {
            product: product,
            isAdded: await product.checkWishlist(req.user)
        }
        res.send(data)
    } catch (e) {
        res.status(500).send()
    }
})

// Get product by owner 
router.get('/productowner/:id', auth, async (req, res, next) => {
    const products = await Product.find({ owner: req.params.id })

    const filteredProducts = products.filter((product) => {
        return !product.isDeleted
    })
    res.send(filteredProducts)
})

// Update product by id
router.patch('/product/:id', auth, async (req, res, next) => {
    auth(req, res, next, [Role.Admin, Role.Seller])
},
    async (req, res) => {
        const updates = Object.keys(req.body)
        const allowedUpdates = ['name', 'colorsAndQuantityAndSizes', 'price', 'category', 'type', 'discount', 'discription']
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

        if (!isValidOperation) {
            return res.status(400).send({ error: 'Invalid updates!' })
        }
        try {

            const product = await Product.findOne({ _id: req.params.id })

            if (!product || product.isDeleted) {
                return res.status(404).send()
            }

            updates.forEach((update) => product[update] = req.body[update])
            await product.save()
            res.send(product)
        } catch (e) {
            res.status(400).send(e)
        }
    })

// Get product's images    
router.get('/product/:id/images', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)

        if (!product || !product.images) {
            throw new Error()
        }

        res.send(product.images)

    } catch (e) {
        res.status(404).send()
    }
})

// Update product's images
router.patch('/product/:id/images', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        const newImages = req.body.images
        var indexCounter = 0
        newImages.forEach((image) => {
            const url = ' https://sallaty-store.herokuapp.com/'
            const path = 'products_images/' + product._id + '_' + indexCounter + '.png'
            fs.writeFileSync(path, image, { encoding: "base64" })
            product.images[indexCounter] = url + path
            indexCounter++
        })

        if (!product || !product.images) {
            throw new Error()
        }

        await product.save()
        res.send(product)
    } catch (e) {
        res.status(404).send()
    }
})

// Delete product by id
router.delete('/product/:id', auth, async (req, res, next) => {
    auth(req, res, next, [Role.Admin, Role.Seller])
},
    async (req, res) => {
        try {
            const product = await Product.findOne({ _id: req.params.id })

            if (!product) {
                res.status(404).send()
            }
            product.isDeleted = true
            await product.save()
            res.send(product)
        } catch (e) {
            res.status(500).send()
        }
    })



// Get product by productrate
router.get('/productrate', auth, async (req, res) => {
    try {
        const products = await Product
            .find({})
            .sort({ rating: -1 })
        const filteredProducts = products.filter((product) => {
            return !product.isDeleted
        })
        let allData = []
        for (let product of filteredProducts) {
            const data = {
                product: product,
                isAdded: await product.checkWishlist(req.user)
            }
            allData.push(data)
        }
        res.send(allData)
    } catch (e) {
        res.status(500).send()
    }
})

// Get product by best salles
router.get('/bestsalles', auth, async (req, res) => {
    try {
        const products = await Product
            .find({})
            .sort({ selling_counter: -1 })
        const filteredProducts = products.filter((product) => {
            return !product.isDeleted
        })
        let allData = []
        for (let product of filteredProducts) {
            const data = {
                product: product,
                isAdded: await product.checkWishlist(req.user)
            }
            allData.push(data)
        }
        res.send(allData)
    } catch (e) {
        res.status(500).send()
    }
})

// Get product by offers
router.get('/offers', auth, async (req, res) => {
    try {
        const products = await Product
            .find({ discount: { $gt: 0 } })

        const filteredProducts = products.filter((product) => {
            return !product.isDeleted
        })
        let allData = []
        for (let product of filteredProducts) {
            const data = {
                product: product,
                isAdded: await product.checkWishlist(req.user)
            }
            allData.push(data)
        }
        res.send(allData)
    } catch (e) {
        res.status(500).send()
    }
})

// Get product by most recent
router.get('/recent', auth, async (req, res) => {
    try {
        const products = await Product
            .find()
            .sort({ date: -1 })

        const filteredProducts = products.filter((product) => {
            return !product.isDeleted
        })
        let allData = []
        for (let product of filteredProducts) {
            const data = {
                product: product,
                isAdded: await product.checkWishlist(req.user)
            }
            allData.push(data)
        }
        res.send(allData)
    } catch (e) {
        res.status(500).send()
    }
})


// Rate product by id
router.post('/rate/:id', auth, async (req, res) => {

    try {
        const product = await Product.findOne({ _id: req.params.id })
        if (!product || product.isDeleted) {
            return res.status(404).send()
        }
        product.rating = (req.body.rate + product.rating) / 2
        await product.save()
        res.send(product)

    } catch (e) {
        res.status(500).send()
    }
})

// get owner information by id
router.get('/ownerinformation/:id', auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })
        res.send(user)
    }
    catch (e) {
        res.status(500).send()
    }
})

// Get product by search
router.post('/search', auth, async (req, res) => {
    try {
        const products = await Product.find()
        const filteredProducts = products.filter((product) => {
            return !product.isDeleted
        })
        const searcher = new FuzzySearch(filteredProducts, ['name', 'discription'], {
            caseSensitive: false
        })
        const result = searcher.search(req.body.search)
        let allData = []
        for (let product of result) {
            const data = {
                product: product,
                isAdded: await product.checkWishlist(req.user)
            }
            allData.push(data)
        }
        res.send(allData)
    } catch (e) {
        res.status(400).send()
    }
})

// rate Highest rated product by id
router.get('/highestrated/:id', auth, async (req, res) => {

    try {
        const product = await Product.find({ owner: req.params.id }).sort({ rating: 1, selling_counter: 1 }).limit(1)
        res.send(product)
    } catch (e) {
        res.status(400).send()
    }
})



module.exports = router
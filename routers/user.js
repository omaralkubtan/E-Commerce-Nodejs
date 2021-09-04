const express = require('express')
const router = new express.Router()
const jwt = require('jsonwebtoken')
const User = require('../modules/user')
const auth = require('../middleware/auth')
const Role = require('../middleware/Roles')
const PremiumUser = require('../modules/premiumUser')
const Contract = require('../modules/contract')


// User logging in by email
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        if (user.isBanned) {
            return res.status(403).send({ error: 'Banned Account!' })
        }
        const token = await user.generateAuthToken()
        res.header('Authorization', token).send(user)
    } catch (e) {
        res.status(400).send(e.toString())
    }
})

// User logging in by number
router.post('/users/loginbynumber', async (req, res) => {
    try {
        const user = await User.findByNumber(req.body.number, req.body.password)
        if (user.isBanned) {
            return res.status(403).send({ error: 'Banned Account!' })
        }
        const token = await user.generateAuthToken()
        res.header('Authorization', token).send(user)
    } catch (e) {
        res.status(400).send(e.toString())
    }
})

// User logging out 
router.post('/users/logout', auth, async (req, res) => {
    try {
        res.send('Ypu are logged out successfuly')
    } catch (e) {
        res.status(500).send()
    }
})

// Get user by id
router.get('/users/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        res.send(user)
    } catch (e) {
        res.status(404).send
    }
})

// User updating profile
router.patch('/users/updatingProfile', auth, async (req, res) => {

    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})


// Check token expiration
router.post('/users/checkAccessiblity', async (req, res) => {
    try {
        const token = req.body.token
        const decoded = jwt.verify(token, 'thisismynewcourse')
        const user = await User.findById(decoded)
        if (user.isBanned) {
            res.status(403).send({ error: 'This User Is Banned' })
        }
        if (!user) {
            res.status(404).send({ error: 'User Not Found' })
        }
        const premiumUser = await PremiumUser.findOne({ user: user.id })
        if (premiumUser) {
            const contract = await Contract.findOne({ company: premiumUser.id })
            if (new Date() > contract.expiringDate) {
                user.role = Role.Normal
                await user.save()
                res.status(403).send({ error: 'Premium Has Expired' })
            }
        }
        res.status(200).send(token)
    } catch (e) {
        res.status(403).send({ error: 'You are not allowed to access' })
    }

})

// Add feedback by user id
router.post('/feedback/:id', auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })
        const feedback = {
            letter: req.body.feedback,
            seen: false
        }
        user.feedback.push(feedback)
        await user.save()
        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})

// Get all feedbacks
router.get('/allFeedback', auth, async (req, res) => {
    try {
        const users = await User.find()
        let feedback = []
        for (let user of users) {
            if (user.feedback.length) {
                for (let feed of user.feedback) {
                    const data = {
                        feedback: feed.letter,
                        id: feed.id,
                        user: user
                    }
                    feedback.push(data)
                }
            }
        }
        res.send(feedback)

    } catch (e) {
        res.status(500).send()
    }
})

// Get all not seen feedbaks
router.post('/allNotSeenFeedback', auth, async (req, res) => {
    try {
        const users = await User.find()
        let feedback = []
        for (let user of users) {

            if (user.feedback.length) {
                for (let feed of user.feedback) {
                    if (!feed.seen) {
                        const data = {
                            feedback: feed.letter,
                            id: feed.id,
                            user: user
                        }
                        feedback.push(data)
                    }
                }
            }
        }
        res.send(feedback)
    } catch (e) {
        res.status(500).send()
    }
})


// Set feedback to seen feedback
router.post('/setFeedback/:id', auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.id })
        for (let feed of user.feedback) {
            if (feed.id === req.params.id) {
                feed.seen = true
            }
        }
        await user.save()
        res.send(user.feedback)
    } catch (e) {

        res.status(500).send()
    }
})

// Add address
router.post('/addAddress', async (req, res, next) => {
    auth(req, res, next, [Role.Normal, Role.Seller])
},
    async (req, res) => {
        try {
            const user = await User.findOne({ _id: req.user.id })

            if (!user) {
                return res.status(404).send()
            }

            user.addresses.push(req.query.address)
            user.save()
            res.send(user)
        } catch (e) {
            res.status(400).send(e)
        }

    })

// get addresses 
router.get('/getAddresses', async (req, res, next) => {
    auth(req, res, next, [Role.Normal, Role.Seller])
},
    async (req, res) => {
        try {
            const user = await User.findOne({ _id: req.user.id })

            if (!user) {
                return res.status(404).send()
            }

            res.send(user.addresses)
        }
        catch (e) {
            res.status(400).send(e)
        }
    })

// Ban Account
router.patch('/banAccount/:id', auth, async (req, res, next) => {
    auth(req, res, next, [Role.Admin])
},
    async (req, res) => {
        try {
            const user = await User.findOne({ _id: req.params.id })
            if (!user) {
                res.status(404).send({ messege: 'User Not Found' })
            }
            user.isBanned = true
            await user.save()
            res.send({ messege: 'Successfully Banned' })
        } catch (e) {
            res.status(400).send(e)
        }
    })

module.exports = router
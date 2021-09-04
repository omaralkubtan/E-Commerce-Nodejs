const express = require('express')
const User = require('../modules/user')
const AdminUser = require('../modules/adminUser')
const auth = require('../middleware/auth')
const router = new express.Router()
const Role = require('../middleware/Roles')


// AdminUser singning up
router.post('/adminUser', async (req, res) => {
    try {
        const user = new User(req.body)
        user.role = 'admin'
        const adminUser = new AdminUser({ user: user.id })
        const token = await user.generateAuthToken()
        await user.save()
        await adminUser.save()
        res.header('Authorization', token).status(201).send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// AdminUser logging in by email
router.post('/adminUser/loginEmail', async (req, res) => {
    try {
        console.log(req.body)
        const user = await User.findByCredentials(req.body.email, req.body.password)
        if (!user) {
            console.log(user)
            res.status(404).send
        }
        const token = await user.generateAuthToken()
        const adminUser = await AdminUser.findOne({ user: user.id })
        if (!adminUser) {
            console.log(adminUser)
            res.status(404).send
        }
        res.header('Authorization', token).send(user)
    } catch (e) {
        res.status(400).send(e.toString())
    }
})

// AdminUser logging in by number
router.post('/adminUser/loginNumber', async (req, res) => {
    try {
        const user = await User.findByNumber(req.body.number, req.body.password)
        if (!user) {
            res.status(404).send
        }
        const token = await user.generateAuthToken()
        const adminUser = await AdminUser.findOne({ user: user.id })
        if (!adminUser) {
            res.status(404).send
        }
        res.header('Authorization', token).send(adminUser)
    } catch (e) {
        res.status(400).send(e.toString())
    }
})

// AdminUser logging out 
router.post('/adminUser/logout', auth, async (req, res) => {
    try {
        res.send('You are logged out successfuly')
    } catch (e) {
        res.status(500).send()
    }
})

// Delete admin user
router.delete('/DeleteAdminUser', auth, async (req, res, next) => {
    auth(req, res, next, [Role.admin])
},
    async (req, res) => {
        try {
            const user = await User.findOneAndDelete({ id: req.user.id })
            if (!user) {
                res.status(404).send({ error: 'User Not Found' })
            }
            const adminUser = await AdminUser.findOneAndDelete({ user: req.user.id })
            if (!adminUser) {
                res.status(404).send('Admin User Not Found')
            }
            await adminUser.remove()
            await user.remove()
            const letter = {
                string: 'Successfully Deleted'
            }
            res.send(letter)
        } catch (e) {
            res.status(400).send(e)
        }
    })

module.exports = router
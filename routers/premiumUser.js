const express = require('express')
const router = new express.Router()
const User = require('../modules/user')
const PremiumUser = require('../modules/premiumUser')
const auth = require('../middleware/auth')
const Contract = require('../modules/contract')


// premiumUser singning up
router.post('/premiumUser', async (req, res) => {
    try {
        const user = await User.findOne({email: req.body.email})
        user.role = 'seller'
        const contract = new Contract({ startingDate: new Date(), expiringDate: req.body.expiringDate })
        const premiumUser = new PremiumUser({ user: user.id, addresses: req.body.addresses, contactNumbers: req.body.contactNumbers })
        contract.company = premiumUser.id
        premiumUser.contract = contract.id
        await contract.save()
        await premiumUser.save()
        await user.save()
        res.status(201).send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Make or update discount
router.post('/discount/:id', auth, async (req, res) => {
    try {
        const product = Product.find({ owner: req.params.id })
        product.discount = req.body.discount
        await product.save()
        res.status(201).send(product)
    }
    catch (e) {
        res.status(500).send()
    }

})


// Extend premium user account period 
router.post('/extendPremium', auth, async (req, res) => {
    try {
        const user = await User.findOne({email: req.body.email})
        const premiumUser = await PremiumUser.findOne({ user: user.id })
        if (!premiumUser) {
            res.status(404).send({ error: 'Account Not Found' })
        }
        const contract = await Contract.findOne({ company: premiumUser.id })
        console.log(req.body.expiringDate)
        contract.expiringDate = req.body.expiringDate
        await contract.save()
        res.send({ messege: 'Expiring Date Has Updated' })
    }
    catch (e) {
        res.status(400).send(e)
    }
})

// Get all premium user
router.get('/allPremiums', auth, async (req, res) => {
    try {
        const premiumUsers = await PremiumUser.find()
        let users = []
        for(let premium of premiumUsers){
             const user = await User.findById(premium.user)
             users.push(user)
        }
        res.send(users)
    } catch (e) {
        res.status(404).send
    }
})

module.exports = router
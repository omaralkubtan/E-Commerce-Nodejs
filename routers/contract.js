const express = require('express')
const auth = require('../middleware/auth')
const router = new express.Router()
const Contract = require('../modules/contract')

// Create Contract
router.post('/contract', auth, async (req, res) => {
    const contract = new Contract({
        ...req.body
    })

    try {
        await contract.save()
        res.status(201).send(contract)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Update contract by id
router.patch('/contract/:id', async (req, res, next) => {
    auth(req, res, next, [Role.Admin])
},
    async (req, res) => {

        const contract = await Contract.findOne({ _id: req.params.id })
        if (!contract) {
            return res.status(404).send()
        }
        contract.company = req.body.company
        contract.startingDate = req.body.startingDate
        contract.expiringDate = req.body.expiringDate
        contract.save()

        res.send(contract)
    })


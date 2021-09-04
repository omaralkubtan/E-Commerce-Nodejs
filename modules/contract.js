const mongoose = require('mongoose')


const contractSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PremiumUser'
    },
    startingDate: {
        type: Date
    },
    expiringDate: {
        type: Date
    }
})

const contract = mongoose.model('Contract', contractSchema)

module.exports = contract
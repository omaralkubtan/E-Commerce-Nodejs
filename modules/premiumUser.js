const mongoose = require('mongoose')


const premiumUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    addresses: [String],
    contract: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract'
    }
})

const premiumUser = mongoose.model('PremiumUser', premiumUserSchema)

module.exports = premiumUser
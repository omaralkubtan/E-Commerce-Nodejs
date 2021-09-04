const mongoose = require('mongoose')


const normalUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'

    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
})

const normalUser = mongoose.model('NormalUser', normalUserSchema)

module.exports = normalUser
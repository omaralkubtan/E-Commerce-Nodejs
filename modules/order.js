const mongoose = require('mongoose')


const orderSchema = new mongoose.Schema({
    orderer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },

    notes: {
        type: String
    },

    quantity: {
        type: Number,
        required: true
    },

    color: {
        type: Number
    },

    size: {
        type: String
    },

    date: {
        type: Date
    },
    premium_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

const Order = mongoose.model('Order', orderSchema)

module.exports = Order
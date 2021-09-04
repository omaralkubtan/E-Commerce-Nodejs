const mongoose = require('mongoose')


const delivaryUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Orders'
    }]
})

const delivaryUser = mongoose.model('DelivaryUser', delivaryUserSchema)

module.exports = delivaryUser
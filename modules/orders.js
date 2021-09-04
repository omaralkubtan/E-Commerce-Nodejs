const mongoose = require('mongoose')
const Order = require('./order')
const Product = require('./product')


const ordersSchema = new mongoose.Schema({
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    }],
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    date: {
        type: Date
    },
    address: {
        type: String,
    },
    beingDelivered: {
        type: Boolean,
        default: false,
    },

    isDelivered: {
        type: Boolean,
        default: false,
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
    total: {
        type: Number
    },
    notes: {
        type: String
    },
    delivary_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DelivaryUser'
    },
    discount: {
        type: Number
    }
})

// Convert array of ids to array of orders
ordersSchema.methods.convertToOrder = async function () {
    const oneOrders = this
    let orders = []
    for (let order of oneOrders.orders) {
        const orderItem = await Order.findById(order)
        const product = await Product.findById(orderItem.product_id)
        orderItem.product_id = product
        orders.push(orderItem)
    }
    return orders
}

const Orderse = mongoose.model('Orderse', ordersSchema)

module.exports = Orderse
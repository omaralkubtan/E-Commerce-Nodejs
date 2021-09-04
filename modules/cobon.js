const mongoose = require('mongoose')

const CobonSchema = new mongoose.Schema({
    code: {
        type: String,

    },
    discount: {
        type: Number,
    },
    expiringdate: {
        type: Date
    }

})

const cobon = mongoose.model('Cobone', CobonSchema)

module.exports = cobon
const mongoose = require('mongoose')


const adminUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
})

const adminUser = mongoose.model('AdminUser', adminUserSchema)

module.exports = adminUser
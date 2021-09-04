const mongoose = require('mongoose')
const MongooseMap = require('mongoose-map')(mongoose)
const NormalUser = require('../modules/normalUser')


const productSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    name: {
        type: String,
        required: true,
    },

    colorsAndQuantityAndSizes: [{
        color: {
            type: Number,
            required: true
        },
        sizesAndQuantity: [{
            size: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                validate(value) {
                    if (value < 0) {
                        throw new Error('Quantity cannot be negative!')
                    }
                }
            }
        }]
    }],

    price: {
        type: Number,
        required: true,
        validate(value) {
            if (value < 0) {
                throw new Error('Price cannot be negative!')
            }
        }
    },

    category: {
        type: String,
        required: true
    },
    type: {
        type: String
    },

    specs: {
        type: MongooseMap
    },

    rating: {
        type: Number,
        validate(value) {
            if (value < 0 || value > 5) {
                throw new Error('rating cannot be negative!')
            }
        }
    },

    discount: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0 || value > 100) {
                throw new Error('discount cannot be negative!')
            }
        }
    },

    discription: {
        type: String
    },

    warranty_period: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('warranty_period cannot be negative!')
            }
        }
    },

    warrantyType: {
        type: String,
        validate(value) {
            if (value !== 'days' && value !== 'weeks' && value !== 'months' && value !== 'years') {
                throw new Error('invalid warranty Type input')
            }
        }
    },

    replacing_period: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('replacement_period cannot be negative!')
            }
        }
    },

    replacementType: {
        type: String,
        validate(value) {
            if (value !== 'days' && value !== 'weeks' && value !== 'months' && value !== 'years') {
                throw new Error('invalid replacement Type input')
            }
        }
    },

    returning_period: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('returning_period cannot be negative!')
            }
        }
    },

    returningType: {
        type: String,
        validate(value) {
            if (value !== 'days' && value !== 'weeks' && value !== 'months' && value !== 'years') {
                throw new Error('invalid returning Type input')
            }
        }
    },

    selling_counter: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('selling_counter cannot be negative!')
            }
        }
    },

    isDeleted: {
        type: Boolean,
        default: false
    },

    images: [{
        type: String
    }],
    date:
    {
        type: Date,
    }
})

// Check if the product is added to user wishlist
productSchema.methods.checkWishlist = async function (user) {
    const normalUser = await NormalUser.findOne({ user: user.id })
    if (!normalUser) {
        return false
    }
    return normalUser.wishlist.includes(this.id)
}

const Product = mongoose.model('Product', productSchema)

module.exports = Product
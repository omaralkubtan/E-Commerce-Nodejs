const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    number: {
        type: String,
        unique: true,
        required: true,
        minlength: 10
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
    },
    role: {
        type: String,
        default: 'normal',
        enum: ['normal', 'admin', 'seller', 'delivary']
    },
    feedback: [{
        letter: {
            type: String
        },
        seen: {
            type: Boolean
        }
    }],
    addresses: [{
        type: String
    }],
    isBanned: {
        type: Boolean,
        default: false
    }

})

// Hiding password and tokens when stringfy user 
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    return userObject
}

// Generate token for authentication
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, 'thisismynewcourse', { expiresIn: '1 year' })

    await user.save()

    return token
}

// check the user before logging in by email
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// check the user before logging in by number
userSchema.statics.findByNumber = async (number, password) => {
    const user = await User.findOne({ number })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
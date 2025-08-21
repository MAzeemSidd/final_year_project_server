const mongoose = require('mongoose');

//Schema Definition
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name must be required']
    },
    emailID: {
        type: String,
        required: [true, 'Email ID must be required']
    },
    password: {
        type: String,
        minlength: 6,
        required: [true, 'Password must be required']
    },
    dob: {
        day: {
            type: Number,
            min: [1, 'Value should be in range from 1 to 31.'],
            max: [31, 'Value should be in range from 1 to 31.'],
            required: [true, 'The value is required and must be a number.']
        },
        month: {
            type: Number,
            min: [1, 'Value should be in range from 1 to 12.'],
            max: [12, 'Value should be in range from 1 to 12.'],
            required: [true, 'The value is required and must be a number.']
        },
        year: {
            type: Number,
            min: [1950, 'You are too old to make an Account.'],
            max: [2004, 'You are not 18+.'],
            required: [true, 'The value is required and must be a number.']
        }
    },
    education: String,
    maritalStatus: {
        type: String,
        enum: ['Single', 'Maried']
    },
    profileImagePath: String,
    friendRequests: Array,
    friends: Array
});

//Model Creation
const User = new mongoose.model('users', UserSchema);

module.exports = User;
const mongoose = require('mongoose');

//Schema Definition
const PostSchema = new mongoose.Schema({
    // user: {
    //     _id: {
    //         type: String,
    //         required: [true, 'User ID is missing']
    //     },
    //     name: {
    //         type: String,
    //         required: [true, 'Username is required']
    //     },
    //     profileImagePath: String,
    // },
    userID: {
        type: String,
        required: [true, 'User ID must be included']
    },
    posterID: String,
    content: {
        text: String,
        imagePath: String,
    },
    likedBy: Array,
    comments: Array,
});

//Model Creation
const Post = new mongoose.model('post', PostSchema);

module.exports = Post;
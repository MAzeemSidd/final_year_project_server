const express = require('express');
const multer = require('multer');
const { createPost } = require('../resorces/functions/userFunctions');
const Post = require('../resorces/models/Post');
const User = require('../resorces/models/User');

const router = express.Router();

const uploadPostImage = multer({ storage: postImageStorage });

//Create Post
router.post('/create-post', uploadPostImage.single('photo'), async(req, res)=>{
    const object = JSON.parse(req.body.object);
    const postData = {...object, content: {...object.content, imagePath: req.file.path}};
    try {
        const result = await createPost(postData);
        return res.send(result);
    } catch (error) {
        return res.status(400).end(error.message);
    }
});

//Get Posts of a perticular user
router.post('/get-single-user-posts', async(req, res)=>{
    let id = req.body._id;
    try {//finding posts of provided ids
        const posts = await Post.find({ userID: { $in: [id] } },{__v: 0});
        //finding users' id, those created the posts then marging that id with posts info..
        //..post by post and then push it to an empty array so that it can be sent.
        const arrayOfPosts = []
        for (const i in posts) {
            //coping the object to apply certain functions on it (i.e. Delete)
            const post = {...posts[i]};
            const userID = post._doc.userID;
            const posterID = post._doc.posterID;
            //Getting user's _id, name & profileImagePath so that, it can be sent to the user.
            const userData = await User.find({ _id: { $in: [userID] } },{name: 1, profileImagePath: 1});
            const posterData = (posterID !== undefined) && (
                await User.find({ _id: { $in: [posterID] } },{name: 1, profileImagePath: 1})
            );
            //Deleting two fields from the object
            delete post._doc.userID; //deleting userID
            (post._doc.posterID !== undefined) && (delete post._doc.posterID); //deleting posterID
            arrayOfPosts.push({...post._doc, user: userData[0], poster: posterData[0]}); //pushing to the list variable
        }
        //send that post array
        res.send(arrayOfPosts);
    } catch (error) {
        res.send(error.message);
    }
});

//Get Posts of All users accept you.
router.post('/get-other-users-posts', async(req, res)=>{
    let id = req.body._id;
    try {//finding posts of ids that are other then the provided id (i.e. other user's posts)
        const doesUserHavePosts = await Post.find({ userID: { $in: [id] } }, { __v: 0});
        //If a user has no post yet and we apply keyword $nin or $in to find against the user's given id, then..
        //..mongoose give us an empty array [] which shows the given user no posts. So we check whether the user
        //..have a post, if not then return all the posts, if exists then return then posts except given id.
        const posts = (doesUserHavePosts == []) ?
            await Post.find({}, { __v: 0})
            :
            await Post.find({ userID: { $nin: [id] } },{__v: 0})
        //finding users' perticular info who created the posts then marging that info with posts info..
        //..post by post and then push it to an empty array so that it can be sent.
        const arrayOfPosts = []
        for (const i in posts) {
            // const post = Object.assign({}, posts[i]);
            const post = {...posts[i]}; //coping the object to apply certain functions on it (i.e. Delete)
            const userID = post._doc.userID;
            const posterID = post._doc.posterID;
            //Getting user's _id, name & profileImagePath so that, it can be sent to the user.
            const userData = await User.find({ _id: { $in: [userID] } },{name: 1, profileImagePath: 1});
            const posterData = (posterID !== undefined) && (
                await User.find({ _id: { $in: [posterID] } },{name: 1, profileImagePath: 1})
            );
            //Deleting two fields from the object
            delete post._doc.userID; //deleting userID
            (post._doc.posterID !== undefined) && (delete post._doc.posterID); //deleting posterID
            arrayOfPosts.push({...post._doc, user: userData[0], poster: posterData[0]}) //pushing to the list variable
        }
        //send that post array
        res.send(arrayOfPosts);
    } catch (error) {
        res.send(error.message);
    }
})

//Handle Like
router.patch('/handle-like-post', async(req, res)=>{
    let postID = req.body.postID;
    let likedBy = req.body.likedBy;
    try {
        const result = await Post.findOne({_id: postID, "likedBy._id": {$nin: [likedBy._id]}})
        if (result) {
            await Post.updateOne({_id: postID}, {$addToSet: {likedBy: likedBy}});
        } else {
            await Post.updateOne({_id: postID}, {$pull: {likedBy: likedBy}});
        }
        const result2 = await Post.findOne({_id: postID}, {__v: 0});
        res.send(result2);
    } catch (error) {
        res.send(error.message);
    }
});

//Share others posts
router.post('/share-others-post', async(req, res)=>{
    // console.log(req.body);
    try {
        const result = await createPost(req.body);
        return res.send(result);
    } catch (error) {
        return res.status(400).end(error.message);
    }
    // res.send(req.body);
});
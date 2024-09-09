//dotenv ki config me 1 bar path define karne se isko use karne..
//..k liye bar bar har file me require karne ki zarorat nahi.
require('dotenv').config({ path: './.env' })
const path = require('path');
const Post = require('./resorces/models/Post');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const express = require('express');
const app = express();
const socketApp = express();
const  socketServer = require('http').createServer(socketApp);
const io = require('socket.io')(socketServer, {
    cors: {
        origin: `http://${process.env.CLIENT_IP_1}:${process.env.CLIENT_PORT}`,
        methods: ['GET', 'POST'],
    }
})
const multer = require('multer');

const {
    getUsers,
    getSpecificUser,
    getSuggestedUsers,
    searchUserByName,
    userAuthentication,
    isUserExist,
    createUser,
    getSpecificUserWithSpecificFields,
    handleSendingFriendRequest,
    handleReceivedFriendRequest,
    createPost,
} = require('./resorces/functions/userFunctions');
const User = require('./resorces/models/User');


//For Uploading Profile Image
const profileImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/user-profile-images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const uploadProfileImage = multer({ storage: profileImageStorage });

const postImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/user-post-images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const uploadPostImage = multer({ storage: postImageStorage });

app.use('/images/user-profile-images', express.static(path.join(__dirname, '/images/user-profile-images')));
app.use('/images/user-post-images', express.static(path.join(__dirname, '/images/user-post-images')));

//Middleware
// app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));



/***......   Connection to MongoDB Shall (Local Database)   ......***/

// mongoose.connect('mongodb://localhost:27017/myProject01', { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('Connection Successfull to Local Database'))
//     .catch( error => console.log(error));
   

/***......   Connection to MongoDB Atlas (Online Database)   ......***/

mongoose.connect(process.env.DATABASE, { 
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connection Successfull to Atlas'))
.catch( error => console.log(error.message));



/***.....   <<<   A P I s   >>>   .....***/


// Signup - checking if user have an account on a perticular email address
app.post('/api/user/is-exist', async (req, res) => {
    try {
        // Checking if a perticular User is already exist in a Collection
        const result = await isUserExist(req.body.emailID);
        //If exist then don't proceed further
        if(result) throw new Error('You have already an account on this Email ID');
        else res.send('');
    }
    catch (error) {
        res.send({error: error.message});
    }
})


//Signup - creating user account
app.post('/api/users/add-user', uploadProfileImage.single('profileImage'), async (req, res) => {

    const credentials = JSON.parse(req.body.credentials);
    const userData = {...credentials, profileImagePath: req.file.path}
    console.log(userData);

    try {
        // Checking if a perticular User is already exist in a Collection
        const result = await isUserExist(userData.emailID);
        //If exist then don't proceed further
        if(result) throw new Error('You have already an account on this Email ID')
    
        //Then, request to Save document in a Collection in DB
        const result2 = await createUser(userData);
        //Ask user if all fields are filled properly.
        if(result2 !== true) throw new Error(result2);
        //Or if no field is empty then send response of successfull account creation
        return res.send({success: true});
    }
    catch (error) {
        res.send({error: error.message});
    }
});

//Updating User
app.patch('/api/user/update-user', async(req, res) => {
    try {
        const result = await getSpecificUser(req.body._id);
        if(result){
            await User.updateOne({_id: req.body._id},
            {$set: {
                name: req.body.name,
                emailID: req.body.emailID,
                password: req.body.password,
                "dob.day": req.body.dob.day,
                "dob.month": req.body.dob.month,
                "dob.year": req.body.dob.year,
                education: req.body.education,
                maritalStatus: req.body.maritalStatus,
            }});
            const result2 = await getSpecificUser(req.body._id);
            await Post.update({ "user._id": { $in: [req.body._id] } }, {$set: { "user.name": result2.name }});
            res.send(result2);
        } else {
            throw new Error('User Not Found');
        }
    } catch (error) {
        res.send(error.message)
    }
})

//Get All Users
app.post('/api/users/data', async (req, res) => {
    const result = await getUsers(req.body.id);
    if(!result) return res.status(404).send('No Item in the Database');
    return res.send(result);
});

//Get suggested Users
app.post('/api/users/suggested-users', async (req, res) => {
    const result = await getSuggestedUsers(req.body);
    return res.send(result);
});

//Getting Specific User
app.post('/api/specific-user/data', async (req, res) => {
    const result = await getSpecificUser(req.body._id);
    if(!result) return res.status(404).send('No Item in the Database');
    return res.send(result);
});

//Getting/Searching Users by Name
app.post('/api/user/search-by-name', async (req, res) => {
    const result = await searchUserByName(req.body.name);
    if(!result) return res.status(404).send(null);
    return res.send(result);
});


//Login - Authenticate User
app.post('/api/users/authentication', async (req, res) => {
    try {
        const result = await userAuthentication(req.body);
        if(!result) throw new Error();
        return res.send(result);
    }
    catch {
        res.status(404).end();
    }
});

//Get Profile Image File
app.post('/api/users/get-profile-picture', async (req, res) => {
    try {
        let absoluteProfileImagePath = path.join(__dirname, req.body.profileImagePath);
        res.sendFile(absoluteProfileImagePath);
    } catch (error) {
        res.send(error.message);
    }
})

//Send Request to User
app.patch('/api/user/handle-send-friend-request', async (req, res) => {
    // const body = req.body;
    // console.log('Body***',body)
    if(req.body.status){
        try {
            const requestee = await getSpecificUserWithSpecificFields(req.body.requestorID)
            await handleSendingFriendRequest(requestee, req.body.receiverID, req.body.status);
            return res.send('Friend Request Sent');
        } catch (error) {
            return res.send(error.message);
        }
    } else {
        try {
            const requestee = await getSpecificUserWithSpecificFields(req.body.requestorID)
            await handleSendingFriendRequest(requestee, req.body.receiverID, req.body.status);
            return res.send('Friend Request Cencelled');
        } catch (error) {
            return res.send(error.message);
        }
    }
});

//Decline Request of User
app.patch('/api/user/handle-received-friend-request', async (req, res)=>{
    if(req.body.status){
        try {
            const requestee = await getSpecificUserWithSpecificFields(req.body.requestorID);
            await handleReceivedFriendRequest(requestee, req.body.receiverID, req.body.status);
            return res.send('Friend Request Accepted');
        } catch (error) {
            return res.send(error.message);
        }
    } else {
        try {
            const requestee = await getSpecificUserWithSpecificFields(req.body.requestorID);
            await handleReceivedFriendRequest(requestee, req.body.receiverID, req.body.status);
            return res.send('Friend Request Declined');
        } catch (error) {
            return res.send(error.message);
        }
    } 
});


//Create Post
app.post('/api/post/create-post', uploadPostImage.single('photo'), async(req, res)=>{
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
app.post('/api/post/get-single-user-posts', async(req, res)=>{
    let id = req.body._id;
    try {//finding posts of provided ids
        const posts = await Post.find({ userID: { $in: [id] } },{__v: 0});
        //finding users' perticular info who created the posts then marging that info with posts info..
        //..post by post and then push it to an empty array so that it can be sent.
        const arrayOfPosts = []
        for (const i in posts) {
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
            arrayOfPosts.push({...post._doc, user: userData[0], poster: posterData[0]}); //pushing to the list variable
        }
        //send that post array
        res.send(arrayOfPosts);
    } catch (error) {
        res.send(error.message);
    }
})
//Get Posts of All users accept you.
app.post('/api/post/get-other-users-posts', async(req, res)=>{
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
app.patch('/api/post/handle-like-post', async(req, res)=>{
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
})
//Share others posts
app.post('/api/post/share-others-post', async(req, res)=>{
    // console.log(req.body);
    try {
        const result = await createPost(req.body);
        return res.send(result);
    } catch (error) {
        return res.status(400).end(error.message);
    }
    // res.send(req.body);
})



//Socket.IO implimentation

io.on('connection', async (socket) => {
    // var numOfFrndReqs = () => findTheNoOfFrndReqs()


    socket.on('send_friend_request', async (data) => {
        // const result = await sendFriendRequest(data);
        //Emitting the result to requested user.
        // const receiveFrndReqEventString = JSON.stringify(`received_friend_request_${data.to}`)
        await socket.emit('abc', {friendRequests: 'hello'});
    })



    socket.on('cencel_friend_request', async (data) => {
        console.log(data);
    })
});

//Socket.IO implimentation ends



//Listening the servers
app.listen(process.env.PORT,
    () => console.log(`REST APIs are listening on port ${process.env.PORT}...`)
);
socketServer.listen(process.env.SOCKET_PORT, 
    () => console.log(`Socket.IO server is listening on port ${process.env.SOCKET_PORT}...`)
);
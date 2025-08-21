const express = require('express');
const multer = require('multer');
const {
    userAuthentication,
    getSpecificUser,
    createUser,
    isUserExist
} = require('../resorces/functions/userFunctions');
const Post = require('../resorces/models/Post');
const User = require('../resorces/models/User');

const router = express.Router();

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


// Signup - checking if user have an account on a perticular email address
router.post('/is-exist', async (req, res) => {
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
router.post('/add-user', uploadProfileImage.single('profileImage'), async (req, res) => {

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
router.patch('/update-user', async(req, res) => {
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

//Login - Authenticate User
router.post('/authentication', async (req, res) => {
    try {
        const result = await userAuthentication(req.body);
        if(!result) throw new Error();
        return res.send(result);
    }
    catch {
        res.status(404).end();
    }
});
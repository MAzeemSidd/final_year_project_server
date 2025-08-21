const express = require('express');
const {
    getSpecificUserWithSpecificFields,
    handleSendingFriendRequest,
    handleReceivedFriendRequest
} = require('../resorces/functions/userFunctions');

const router = express.Router();

//Send Request to User
router.patch('/send', async (req, res) => {
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

//Recieve Request of User
router.patch('/action', async (req, res)=>{
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
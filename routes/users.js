const express = require('express');
const {
    getUsers,
    getSuggestedUsers,
    getSpecificUser,
    searchUserByName
} = require('../resorces/functions/userFunctions');

const router = express.Router();

//Get All Users
router.post('/data', async (req, res) => {
    const result = await getUsers(req.body.id);
    if(!result) return res.status(404).send('No Item in the Database');
    return res.send(result);
});

//User suggestions
router.post('/api/users/suggested-users', async (req, res) => {
    const result = await getSuggestedUsers(req.body);
    return res.send(result);
});

//Get specific User
router.post('/api/users/specific-user', async (req, res) => {
    const result = await getSpecificUser(req.body._id);
    if(!result) return res.status(404).send('No Item in the Database');
    return res.send(result);
});

//Search users by name
router.post('/api/user/search-by-name', async (req, res) => {
    const result = await searchUserByName(req.body.name);
    if(!result) return res.status(404).send(null);
    return res.send(result);
});
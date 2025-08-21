//dotenv ki config me 1 bar path define karne se isko use karne..
//..k liye bar bar har file me require karne ki zarorat nahi.
require('dotenv').config({ path: './.env' })
const path = require('path');
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

app.use('/images/user-profile-images', express.static(path.join(__dirname, '/images/user-profile-images')));
app.use('/images/user-post-images', express.static(path.join(__dirname, '/images/user-post-images')));

//Middleware
// app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const personalActionsRoutes = require('./routes/personalActions');
const friendRequestRoutes = require('./routes/friendRequest');

app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/account', personalActionsRoutes);
app.use('/api/request', friendRequestRoutes);


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
//Get Profile Image File
app.post('/api/users/get-profile-picture', async (req, res) => {
    try {
        let absoluteProfileImagePath = path.join(__dirname, req.body.profileImagePath);
        res.sendFile(absoluteProfileImagePath);
    } catch (error) {
        res.send(error.message);
    }
})


//Listening the servers
app.listen(process.env.PORT,
    () => console.log(`REST APIs are listening on port ${process.env.PORT}...`)
);
socketServer.listen(process.env.SOCKET_PORT, 
    () => console.log(`Socket.IO server is listening on port ${process.env.SOCKET_PORT}...`)
);
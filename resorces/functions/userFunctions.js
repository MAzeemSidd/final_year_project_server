const User = require('../models/User');
const Post = require('../models/Post');


//.//.//.//...Functions...//.//.//.//

//Get Users list
const getUsers = async (id) => {
    //find's 2nd param is the object of "names of the fields" in key value pair..
    //..If value is 1 that field will be returned, Zero "0" for no return.
    const getResult = await User.find({ _id: { $nin: [id] } }, {name: 1, profileImagePath: 1});
    if(getResult.length == 0) return false
    return getResult;
}

//Get Suggested User List
const getSuggestedUsers = async (obj) => {
    const result = await User.find({ _id: {$nin: [obj._id]},
                                    $or: [{education: { $in: [obj.education] }},
                                    {maritalStatus: { $in: [obj.maritalStatus] }},
                                    {"dob.year": { $gt: (obj.dob.year)-6, $lt: (obj.dob.year)+6 }}] },
                                    {__v: 0});
    // const array2 = await User.find({ _id: {$nin: [obj._id]}, maritalStatus: { $in: [obj.maritalStatus] } }, {__v: 0});
    // const array3 = await User.find({ _id: {$nin: [obj._id]}, "dob.year": { $gt: (obj.dob.year)-5, $lt: (obj.dob.year)+5 } }, {__v: 0});
    
    // const mergedArray = [...array1, ...array2, ...array3].reduce((acc, curr) => {
    //     const existingObj = acc.find(obj => obj._id === curr._id);
    //     if (existingObj) {
    //       Object.assign(existingObj, curr);
    //     } else {
    //       acc.push(curr);
    //     }
    //     return acc;
    //   }, []);
      
      return result;
}


//Get specific User.
const getSpecificUser = async (value) => {
    //First params takes the field which must be matched to find an item from db
    //Second param takes the field which should and should not be returned from..
    //..the searched item (1 is for return and 0 is for not return) 
    const getResult = await User.findOne({_id: value},{__v: 0});
    if(getResult === null) return false
    return getResult;
    // console.log(getResult);
}

const searchUserByName = async (value) => {
    const getResult = await User.findOne({name: value},{__v: 0});
    if(getResult === null) return false
    return getResult;
}

const getSpecificUserWithSpecificFields = async(value) => {
    try {
        const requestee = await User.findOne({_id: value},{_id: 1, name: 1});
        return requestee;
    } catch (error) {
        throw new Error(error.message)
    }
}

//Send Friend Request
const handleSendingFriendRequest = async (requestee, receiverID, status) => {
    if(status){
        try {
            //Updating field
            await User.updateOne({_id: receiverID}, {$addToSet: {friendRequests: requestee}});
            //Get the field and return it
            const result = await User.findOne({_id: receiverID});
            return result;
        } catch (error) {
            throw new Error(error.message);
        }
    } else {
        try {
            const res = await User.updateOne({_id: receiverID}, {$pull: {friendRequests: requestee}})
            return res;
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

//Receive Friend Request handlar
const handleReceivedFriendRequest = async (requestee, receiverID, status) => {
    if(status){
        try {
            //Add to friends array
            await User.updateOne({_id: receiverID}, {$addToSet: {friends: requestee}});
            //Remove from friendRequests array
            await User.updateOne({_id: receiverID}, {$pull: {friendRequests: requestee}});
            //Get the field and return it
            const result = await User.findOne({_id: receiverID});
            return result;
        } catch (error) {
            throw new Error(error.message);
        }
    } else {
        try {
            await User.updateOne({_id: receiverID}, {$pull: {friendRequests: requestee}});
            const result = await User.findOne({_id: receiverID});
            return result;
        } catch (error) {
            throw new Error(error.message);
        }
    }
}


//Authenticate to Login user
const userAuthentication = async (value) => {
    const result = await User.findOne({emailID: value.emailID, password: value.password},{__v: 0});
    // console.log(result);
    if(result === null) return false;
    return result;
}


//Checking if a perticular User is already exist in a Collection
const isUserExist = async (value) => {
    const result = await User.find({emailID: value});
    if(result.length == 0) return false;
    return true;
}


//Creating a Document in a Collection
const createUser = async (doc) => {
    try {
        const user = new User(doc);
        //Save to DB
        await user.save();
        return true;
    }
    catch ({errors}) {
        if(errors.name) return errors.name.message;
        else if(errors.emailID) return errors.emailID.message;
        else if(errors.password) return errors.password.message;
        else if(errors['dob.day']) {
            if (errors['dob.day'].kind === 'Number') {
                return 'The value must be a Number';
            }
            return errors['dob.day'].properties.message;
        }
        else if(errors['dob.month']) {
            if (errors['dob.month'].kind === 'Number') {
                return 'The value must be a Number';
            }
            return errors['dob.month'].properties.message;
        }
        else if(errors['dob.year']) {
            if (errors['dob.year'].kind === 'Number') {
                return 'The value must be a Number';
            }
            return errors['dob.year'].properties.message;
        }
        else if(errors.education) return errors.education.message;
        else if(errors.maritalStatus.properties.type === 'enum') {
            return 'The value should be either "Maried" or "Single"';
        }    
        // else return console.log(errors);
    }
}

//Create Post
const createPost = async (obj) => {
    try {
        const post = new Post(obj);
        //Save to DB
        await post.save();
        return true;
    } catch(error) {
        throw new Error(error.message);
    }
}



module.exports = {
    getUsers,
    getSpecificUser,
    getSuggestedUsers,
    searchUserByName,
    userAuthentication,
    isUserExist,
    createUser,
    handleSendingFriendRequest,
    handleReceivedFriendRequest,
    getSpecificUserWithSpecificFields,
    createPost,
}
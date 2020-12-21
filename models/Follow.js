const usersCollection = require('../db').db().collection('users');
const followsCollection = require('../db').db().collection('follows');
const ObjectID = require('mongodb').ObjectID;
const User = require('./User');

let Follow = function(followedUsername, authorId) {
  console.log("followed username in param: ", followedUsername);
  this.followedUsername = followedUsername;
  this.authorId = authorId;
  this.errors = [];
}

Follow.prototype.cleanUp = function() {
    if (typeof(this.followedUsername) != 'string') { this.followedUsername = ''}
}

Follow.prototype.validate = async function(action) {
  // followUsername must exist in database
  let followedAccount = await usersCollection.findOne({username: this.followedUsername});
  if (followedAccount) {
    this.followedId = followedAccount._id;
  } else {
    this.errors.push('You cannot follow a user that does not exist.')
  }

  let followAlreadyExist = await followsCollection.findOne({followedId:this.followedId, authorId: new ObjectID(this.authorId)});
  if (action == 'create') {
    if (followAlreadyExist) { this.errors.push('You are already following this user.')}
  }
  if (action == 'remove') {
    if (!followAlreadyExist) { this.errors.push('You cannot stop following someone you do not already follow.')}
  }
  //console.log("this.followedid: ", this.followedId);
  //console.log("this.authorid: ", this.authorId);
  if (this.followedId.equals(this.authorId)) { this.errors.push('You cannot follow yourself.')}
  console.log(this.errors);
}

Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate('create');
    if (!this.errors.length) {
      await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)});
      resolve();
    } else {
      reject(this.errors)
    }
  });
}

Follow.prototype.remove = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate('remove');
    if (!this.errors.length) {
      await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)});
      resolve();
    } else {

      reject(this.errors)
    }
  });
}

Follow.isVisitorFollowing = async function(followedId, visitorId) {
  let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectID(visitorId)})
  if (followDoc) {
    return true;
  } else {
    return false;
  }
}

Follow.getFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followsCollection.aggregate([
        {$match: {followedId: id}},
        {$lookup: {from: "users", localField: "authorId", foreignField: "_id", as: "userDoc"}},
        {$project: {
          username: {$arrayElemAt: ["$userDoc.username", 0]},
          email: {$arrayElemAt: ["$userDoc.email", 0]}
        }}
      ]).toArray();
      //console.log('after aggregate: ', followers);
      followers = followers.map(follower => {
        let user = new User(follower, true);
        return {username: follower.username, avatar: user.avatar}
      });
      resolve(followers);
    } catch (err) {
      console.log(err);
    }
  });
}


Follow.getFollowingsById = function(id) {
  return new Promise(async (resolve, reject) => {
    try {
      let followings = await followsCollection.aggregate([
        {$match: {authorId: id}},
        {$lookup: {from: "users", localField: "followedId", foreignField: "_id", as: "userDoc"}},
        {$project: {
          username: {$arrayElemAt: ["$userDoc.username", 0]},
          email: {$arrayElemAt: ["$userDoc.email", 0]}
        }}
      ]).toArray();
      followings = followings.map(following => {
        let user = new User(following, true);
        return {username: following.username, avatar: user.avatar}
      });
      resolve(followings);
    } catch(err) {
      console.log(err);
    }
  });
}

Follow.countFollowerByAuthor = async function(id) {
  return new Promise(async (resolve, reject) => {
    let followerCount = await followsCollection.countDocuments({followedId: id});
    resolve(followerCount);
  });
}


Follow.countFollowingByAuthor = function(id) {
  return new Promise(async (resolve, reject) => {
    let followingCount = await followsCollection.countDocuments({authorId: id});
    resolve(followingCount);
  });
}


module.exports = Follow;

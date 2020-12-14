
const postsCollection = require('../db').db().collection('posts');
const ObjectID = require('mongodb').ObjectID; // This will return a MongoDB OjbectID upon receiving a string id
const User = require('./User');
const sanitizeHTML = require('sanitize-html');

// Constructor function
let Post = function(data, userid, requestedPostId) {
  this.data = data;
  this.errors = [];
  this.userid = userid;
  this.requestedPostId = requestedPostId;
}

Post.prototype.cleanUp = function() {
    if (typeof(this.data.title) != 'string') { this.data.title = ''; }
    if (typeof(this.data.body) != 'string') { this.data.body = ''; }

    // Remove any bogus properties by manually reassigning the only properties that we need
    this.data = {
      title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: []}),
      body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: []}),
      createdDate: new Date(),
      author: ObjectID(this.userid)
    };
}

Post.prototype.validate = function() {
  if (this.data.title == '' ) { this.errors.push("You must provide a title."); }
  if (this.data.body == '') { this.errors.push("You must provide post content."); }
}

Post.prototype.saveForm = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      postsCollection.insertOne(this.data).then((info) => {
        resolve(info.ops[0]._id);
      }).catch(() => {
        this.errors.push("Please try again later.");
        reject(this.errors)
      });
    } else {
      reject(this.errors);
    }
  });
}

Post.prototype.updateForm = function() {
  return new Promise(async (resolve, reject) => {
    //console.log(this.requestedPostId);
    //console.log(this.userid);
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userid);
      if (post.isVisitorOwner) {
        let status = await this.actuallyUpdate();
        resolve(status)
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
}


Post.prototype.actuallyUpdate = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate(
        {_id: new ObjectID(this.requestedPostId)},
        {$set: {title: this.data.title, body: this.data.body}}
      );
      resolve('success');
    } else {
      resolve('failure')
    }
  });
}


Post.reusableFindById = function(uniqueOperations, visitorId) {
  return new Promise(async function(resolve, reject) {

    let aggOperations = uniqueOperations.concat([
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}}, // localn: posts, foreign: users
      {$project: {
        title: 1,
        body: 1,
        createdDate: 1,
        authorId: "$author",
        author: {$arrayElemAt: ["$authorDocument", 0]}
      }}
    ]);
    let posts = await postsCollection.aggregate(aggOperations).toArray();

    posts = posts.map(function(post) {
      post.isVisitorOwner = post.authorId.equals(visitorId);
      post.authorId = undefined; // Not to send authorId to the browser (security matter)
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      //console.log(post);
      return post;
    });
    resolve(posts);
  });
}


Post.findSingleById = function(id, visitorId) {
  return new Promise(async function(resolve, reject) {
    // Validation
    if (typeof(id) != 'string' || !ObjectID.isValid(id)) {
        reject();
        return;
    }

    let posts = await Post.reusableFindById([{$match: {_id: new ObjectID(id)}}], visitorId);
    if (posts.length) {
      resolve(posts[0]);
    } else {
      reject();
    }
  })
}

Post.findByAuthorId = function(authorId) {
  return Post.reusableFindById([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}])
}


Post.deleteForm = function(postIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
      try {
        let post = await Post.findSingleById(postIdToDelete, currentUserId);
        if (post.isVisitorOwner) {
          await postsCollection.deleteOne({_id: new ObjectID(postIdToDelete)})
          resolve();
        } else {
          reject();
        }
      } catch(error) {
        console.log(error);
        reject();
      }
  });
}

Post.search = function(searchTerm) {
  return new Promise(async (resolve, reject) => {
    // Validation
    if (typeof(searchTerm) == 'string') {
      let posts = await Post.reusableFindById([
        {$match: {$text: {$search: searchTerm}}}, // MongoDB text search: not complete search, but search on text
        {$sort: {score: {$meta: "textScore"}}}
      ]);
      resolve(posts);
    } else {
      reject();
    }

  });
}

module.exports = Post;


const postsCollection = require('../db').db().collection('posts');
const ObjectID = require('mongodb').ObjectID; // This will return a MongoDB OjbectID upon receiving a string id
const User = require('./User');

// Constructor function
let Post = function(data, userid) {
  this.data = data;
  this.errors = [];
  this.userid = userid;
}

Post.prototype.cleanUp = function() {
    if (typeof(this.data.title.trim()) != 'string') { this.data.title = ''; }
    if (typeof(this.data.body.trim()) != 'string') { this.data.body = ''; }

    // Remove any bogus properties by manually reassigning the only properties that we need
    this.data = {
      title: this.data.title,
      body: this.data.body,
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
      postsCollection.insertOne(this.data).then(() => {
        resolve();
      }).catch(() => {
        this.errors.push("Please try again later.");
        reject(this.errors)
      });
    } else {
      reject(this.errors);
    }
  });
}


Post.findSingleById = function(id) {
  return new Promise(async function(resolve, reject) {
    // Validation
    if (typeof(id) != 'string' || !ObjectID.isValid(id)) {
        reject();
        return;
    }

    //let post = await postsCollection.findOne({_id: new ObjectID(id)});
    // Use 'aggregate' to receive author information from the users collection

    let posts = await postsCollection.aggregate([
      {$match: {_id: new ObjectID(id)}},
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}}, // localn: posts, foreign: users
      {$project: {
        title: 1,
        body: 1,
        createdDate: 1,
        author: {$arrayElemAt: ["$authorDocument", 0]}
      }}
    ]).toArray();


    posts.map(function(post) {
      console.log('email', post.author.email);
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      console.log(post);
      return post;
    });

    if (posts.length) {
      resolve(posts[0]);
          console.log(posts[0]);
    } else {
      reject();
    }
  });
}

module.exports = Post;

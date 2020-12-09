const bcrypt = require('bcryptjs'); // For hashing password
const usersCollection = require('../db').db().collection("users");
const validator = require('validator');
const md5 = require('md5'); // For gravatar

let User = function(data, getAvatar) {
  this.data = data;
  this.errors = [];
  console.log('in user.js ', this.data.email);
  if (getAvatar == undefined) { getAvatar = false};
  if (getAvatar) {this.getAvatar()}
}


User.prototype.cleanUp = function() {
  if (typeof(this.data.username) != 'string') {
    this.data.username = "";
  }
  if (typeof(this.data.email) != 'string') {
    this.data.username = "";
  }
  if (typeof(this.data.password) != 'string') {
    this.data.username = "";
  }

  // Get rid of any bogus properties by manually reassigning the only properties that we want
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLocaleLowerCase(),
    password: this.data.password.trim()
  }
}

User.prototype.validate = function() {
  return new Promise(async (resolve, reject) => {
    if (this.data.username == '') { this.errors.push("You must provide a username.");}
    if (this.data.username != '' && !validator.isAlphanumeric(this.data.username)) {
      this.errors.push("Username can only contain letters and numbers.")
    }
    if (!validator.isEmail(this.data.email)) {
      this.errors.push("You must provide a valid email address.")
    }
    if (this.data.password == '') {this.errors.push("You must provide a password.");}

    if (this.data.username.length > 0 && this.data.username.length < 3) {
      this.errors.push("The username must be at least 3 characters.")
    }
    if (this.data.email.length > 50) {
      this.errors.push("The email cannot exceed 30 characters.");
    }

    if (this.data.password.length > 0 && this.data.password.length < 7) {
      this.errors.push("The password must be at least 7 characters.")
    }
    if (this.data.password.length > 30) {
      this.errors.push("The password cannot exceed 30 characters.");
    }

    if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
      let usernameExists = await usersCollection.findOne({username: this.data.username});
      if (usernameExists) { this.errors.push("This username is already taken.");}
    }
    if (validator.isEmail(this.data.email)) {
      let emailExists = await usersCollection.findOne({email: this.data.email});
      if (emailExists) { this.errors.push("This email already exists.")}
    }
    resolve();
  });
}


User.prototype.register = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate();

    if (!this.errors.length) {
      let salt = bcrypt.genSaltSync(10);
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      await usersCollection.insertOne(this.data);
      resolve();
      this.getAvatar();
    } else {
      reject(this.errors);
    }
  });
}


User.prototype.login = function() {
  return new Promise((resolve, reject) => {
    this.data.email = '';
    this.cleanUp();

    usersCollection.findOne({username: this.data.username}).then(attemptedUser => {
      if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
        resolve("Logged in");
        this.data = attemptedUser;
        this.getAvatar();
      } else {
        reject("Invalid Username and/or Password.");
      }
    }).catch(function(err) {
        reject("Please try again later.")
    });
  });
}


User.prototype.getAvatar = function() {
    this.avatar = `https://s.gravatar.com/avatar/${md5(this.data.email)}?s=128`;
    //console.log(this.avatar);
}

module.exports = User;

// traditional callback process for login
// return new Promise((resolve, reject) => {
//   this.data.email = '';
//   this.cleanUp();
//   usersCollection.findOne({username: this.data.username}, (err, attemptedUser) => {
//     if (attemptedUser && attemptedUser.password == this.data.password) {
//       resolve("Congrats");
//     } else {
//       reject("Invalid");
//     }
//   });
// })

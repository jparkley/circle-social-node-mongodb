const usersCollection = require('../db').collection("users");
const validator = require('validator');

let User = function(data) {
  this.data = data;
  this.errors = [];
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
  if (this.data.username == '') { this.errors.push("You must provide a username.");}

  if (this.data.username != '' && !validator.isAlphanumeric(this.data.username)) {
    this.errors.push("Username can only contain letters and numbers.")
  }

  if (!validator.isEmail(this.data.email)) {
    this.errors.push("You must provide a valid email address.")
  }
  if (this.data.password == '') {this.errors.push("You must provide a password.");}

  if (this.data.username.length > 0 && this.data.username.length < 3) {
    this.errors.push("The password must be at least 3 characters.")
  }
  if (this.data.password.length > 30) {
    this.errors.push("The password cannot exceed 30 characters.");
  }

  if (this.data.password.length > 0 && this.data.password.length < 7) {
    this.errors.push("The password must be at least 7 characters.")
  }
  if (this.data.password.length > 50) {
    this.errors.push("The password cannot exceed 50 characters.");
  }
}


User.prototype.register = function() {
  this.cleanUp();
  this.validate();

  console.log(this.data);
  if (!this.errors.length) {
    usersCollection.insertOne(this.data);
  }
}

module.exports = User;

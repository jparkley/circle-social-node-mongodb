

const User = require('../models/User');

exports.displayHome = function(req, res) {
  res.render('home-guest');
}


exports.register = function(req, res) {
  let user = new User(req.body);
  user.register();

  if (user.errors.length > 0) {
    res.send(user.errors)
  } else {
    res.send("Thank you for registering.");
  }
}
